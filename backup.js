/* ===== FILE BACKUP / RESTORE =====
 * Plain backups are standards-compliant STORE-mode ZIP archives. Original
 * files remain directly accessible to any ZIP utility, while an internal
 * manifest preserves folders, privacy flags and timestamps for restoration.
 *
 * Encrypted backups use a PicManage-only .pmbak container. The manifest and
 * every file chunk are independently protected with AES-256-GCM so large files
 * never need to be encrypted or decrypted in one contiguous ArrayBuffer.
 */

const BACKUP_FORMAT = "pic-manage-backup";
const BACKUP_VERSION = 1;
const BACKUP_MANIFEST_PATH = ".pic-manage-backup/manifest.json";
const BACKUP_ENCRYPTED_MAGIC = new Uint8Array([0x50, 0x4d, 0x42, 0x41, 0x4b, 0x32, 0x0d, 0x0a]);
const BACKUP_ENCRYPTED_HEADER_BYTES = 48;
const BACKUP_ENCRYPT_CHUNK_BYTES = 8 * 1024 * 1024;
const BACKUP_KDF_ITERATIONS = 250000;
const BACKUP_IO_CHUNK_BYTES = 4 * 1024 * 1024;
const BACKUP_MAX_MANIFEST_BYTES = 16 * 1024 * 1024;
const BACKUP_ZIP_UINT32_MAX = 0xffffffff;

let backupExportState = null;
let backupImportPendingFile = null;
let backupBusy = false;

function backupYield() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function backupSetProgress(done, total, fileName, title) {
  updateImportProgress(done, total, fileName);
  const heading = document.getElementById("importProgressTitle");
  if (heading && title) heading.textContent = title;
}

function backupHideProgress(delay = 700) {
  setTimeout(() => {
    hideImportProgress();
    const heading = document.getElementById("importProgressTitle");
    if (heading) heading.textContent = t("importingFiles");
  }, delay);
}

function backupDateSlug(date = new Date()) {
  const pad = value => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function backupDefaultBaseName(scope) {
  return `pic-manage-${scope === "selected" ? "selected" : "full"}-${backupDateSlug()}`;
}

function backupSafeDownloadName(value, fallback) {
  const cleaned = String(value || "")
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, "_")
    .replace(/[. ]+$/g, "")
    .trim()
    .slice(0, 160);
  return cleaned || fallback;
}

function backupSafeArchiveSegment(value, fallback = "file") {
  const cleaned = String(value || "")
    .replace(/[\u0000-\u001f/\\]+/g, "_")
    .replace(/[. ]+$/g, "")
    .trim()
    .slice(0, 120);
  return cleaned || fallback;
}

function backupAppendNameSuffix(name, suffix) {
  const value = String(name || "file");
  const match = value.match(/^(.*?)(\.[^.]{1,16})$/);
  return match ? `${match[1]}${suffix}${match[2]}` : `${value}${suffix}`;
}

function backupMakeUniquePath(basePath, usedPaths) {
  let candidate = basePath;
  let index = 2;
  while (usedPaths.has(candidate.toLocaleLowerCase())) {
    const slash = basePath.lastIndexOf("/");
    const folder = slash >= 0 ? basePath.slice(0, slash + 1) : "";
    const name = slash >= 0 ? basePath.slice(slash + 1) : basePath;
    candidate = folder + backupAppendNameSuffix(name, ` (${index++})`);
  }
  usedPaths.add(candidate.toLocaleLowerCase());
  return candidate;
}

function backupHasPrivateContent(files, folders) {
  return files.some(file => file.isPrivate) || folders.some(folder => folder.isPrivate);
}

function backupFoldersForScope(files, scope) {
  const records = getCustomFolderRecords();
  if (scope === "all") {
    const byName = new Map(records.map(record => [record.name, { ...record }]));
    files.filter(file => file.folder).forEach(file => {
      if (!byName.has(file.folder)) byName.set(file.folder, { name: file.folder, isPrivate: isFolderPrivate(file.folder) });
    });
    return [...byName.values()];
  }

  const names = new Set(files.filter(file => file.folder).map(file => file.folder));
  return [...names].map(name => {
    const record = records.find(item => item.name === name);
    return { name, isPrivate: !!(record?.isPrivate || isFolderPrivate(name)) };
  });
}

async function openBackupExport(scope = "all") {
  if (backupBusy) return;
  const all = await dbAll();
  const files = scope === "selected"
    ? [...multiSelectIds].map(id => all.find(file => file.id === id)).filter(Boolean)
    : all;
  const folders = backupFoldersForScope(files, scope);

  if (!files.length && (scope === "selected" || !folders.length)) {
    toast(scope === "selected" ? "请先勾选要导出的文件" : "暂无可导出的文件", "info");
    return;
  }

  if (backupHasPrivateContent(files, folders) && (!isAdmin || !adminKey)) {
    toast("备份包含私密内容，请先进入管理员模式", "error");
    return;
  }

  backupExportState = { scope, files, folders };
  closeSettings();
  const totalBytes = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
  document.getElementById("backupExportSummary").textContent = `${scope === "selected" ? "已勾选" : "全部"} ${files.length} 个文件 · ${fmtSize(totalBytes)}`;
  document.getElementById("backupFileName").value = backupDefaultBaseName(scope);
  document.getElementById("backupPassword").value = "";
  document.getElementById("backupPasswordConfirm").value = "";

  const preferredMode = backupHasPrivateContent(files, folders) ? "encrypted" : "plain";
  const radio = document.querySelector(`input[name="backupMode"][value="${preferredMode}"]`);
  if (radio) radio.checked = true;
  setBackupExportMode(preferredMode);
  document.getElementById("backupExportDialog").classList.add("active");
}

function setBackupExportMode(mode) {
  const encrypted = mode !== "plain";
  document.getElementById("backupPasswordFields").hidden = !encrypted;
  document.getElementById("backupModeEncryptedLabel").classList.toggle("active", encrypted);
  document.getElementById("backupModePlainLabel").classList.toggle("active", !encrypted);
  const warning = document.getElementById("backupModeWarning");
  const hasPrivate = !!backupExportState && backupHasPrivateContent(backupExportState.files, backupExportState.folders);
  warning.classList.toggle("warn", !encrypted && hasPrivate);
  warning.textContent = encrypted
    ? "文件名、文件夹和内容都会加密；恢复时必须输入此密码。"
    : (hasPrivate
      ? "注意：普通 ZIP 中的私密文件会还原为未加密原文件，请妥善保存。"
      : "ZIP 内保留原文件和文件夹，可直接使用任意解压程序打开。");
}

function closeBackupExport() {
  if (backupBusy) return;
  document.getElementById("backupExportDialog").classList.remove("active");
  backupExportState = null;
}

async function confirmBackupExport() {
  if (backupBusy || !backupExportState) return;
  const mode = document.querySelector('input[name="backupMode"]:checked')?.value || "encrypted";
  const fallbackName = backupDefaultBaseName(backupExportState.scope);
  let name = backupSafeDownloadName(document.getElementById("backupFileName").value, fallbackName);
  let password = "";

  if (mode === "encrypted") {
    password = document.getElementById("backupPassword").value;
    const confirmPassword = document.getElementById("backupPasswordConfirm").value;
    if (password.length < 6) { toast("备份密码至少需要 6 位", "error"); return; }
    if (password !== confirmPassword) { toast("两次输入的备份密码不一致", "error"); return; }
    name = name.replace(/\.(?:zip|pmbak)$/i, "") + ".pmbak";
  } else {
    name = name.replace(/\.(?:zip|pmbak)$/i, "") + ".zip";
  }

  const state = backupExportState;
  document.getElementById("backupExportDialog").classList.remove("active");
  backupBusy = true;
  document.getElementById("backupExportConfirmBtn").disabled = true;
  try {
    await runBackupExport(state, mode, password, name);
    backupExportState = null;
    if (state.scope === "selected" && multiSelectMode) toggleMultiSelect();
  } finally {
    password = "";
    backupBusy = false;
    document.getElementById("backupExportConfirmBtn").disabled = false;
  }
}

async function backupDeriveKey(password, salt, iterations) {
  const raw = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function backupDecryptFramedPrivateFile(file, header) {
  const plainChunkSize = readUint32FromBytes(header, 24);
  if (!plainChunkSize || plainChunkSize > 64 * 1024 * 1024) throw new Error("私密文件加密分块无效");
  const key = await deriveKey(adminKey, header.slice(8, 24));
  const parts = [];
  const plainSize = Number(file.size || 0);
  const chunkCount = Math.ceil(plainSize / plainChunkSize);

  for (let index = 0; index < chunkCount; index++) {
    const plainLength = Math.min(plainChunkSize, plainSize - index * plainChunkSize);
    const frameStart = 28 + index * (plainChunkSize + 32);
    const frame = await dbReadStoredRange(file, frameStart, frameStart + plainLength + 32);
    if (frame.length !== plainLength + 32) throw new Error("私密文件分块不完整");
    const encryptedLength = readUint32FromBytes(frame, 12);
    if (encryptedLength !== plainLength + 16) throw new Error("私密文件分块长度无效");
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: frame.slice(0, 12) },
      key,
      frame.slice(16, 16 + encryptedLength)
    );
    parts.push(plain);
    await backupYield();
  }
  return new Blob(parts, { type: file.type || "application/octet-stream" });
}

async function backupDecryptLegacyPrivateFile(file, header) {
  const raw = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(adminKey),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const keyBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: header.slice(0, 16), iterations: 100000, hash: "SHA-256" },
    raw,
    256
  );
  const ctrKey = await crypto.subtle.importKey("raw", keyBits, "AES-CTR", false, ["decrypt"]);
  const iv = header.slice(16, 28);
  const plainSize = Number(file.size || 0);
  const alignedChunkSize = Math.floor(BACKUP_ENCRYPT_CHUNK_BYTES / 16) * 16;
  const parts = [];

  for (let offset = 0; offset < plainSize; offset += alignedChunkSize) {
    const end = Math.min(plainSize, offset + alignedChunkSize);
    const ciphertext = await dbReadStoredRange(file, 28 + offset, 28 + end);
    if (ciphertext.length !== end - offset) throw new Error("旧版私密文件数据不完整");
    const counter = new Uint8Array(16);
    counter.set(iv, 0);
    new DataView(counter.buffer).setUint32(12, (2 + Math.floor(offset / 16)) >>> 0, false);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-CTR", counter, length: 32 },
      ctrKey,
      ciphertext
    );
    parts.push(plain);
    await backupYield();
  }
  return new Blob(parts, { type: file.type || "application/octet-stream" });
}

async function backupPlainBlobForFile(file) {
  if (!file.isPrivate) {
    const full = await ensureFileData(file);
    const blob = full.data instanceof Blob ? full.data : new Blob([full.data || new Uint8Array(0)]);
    return blob.type || !file.type ? blob : new Blob([blob], { type: file.type });
  }
  if (!adminKey) throw new Error("管理员会话已过期");
  const header = await dbReadStoredRange(file, 0, 28);
  if (header.length < 28) throw new Error("私密文件头不完整");
  return isChunkedEncryptedData(header)
    ? backupDecryptFramedPrivateFile(file, header)
    : backupDecryptLegacyPrivateFile(file, header);
}

async function backupPrepareFiles(files, totalSteps) {
  const prepared = [];
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    backupSetProgress(index, totalSteps, file.name, "正在准备备份");
    try {
      const blob = await backupPlainBlobForFile(file);
      if (blob.size !== Number(file.size || 0)) {
        throw new Error(`文件大小校验失败（预期 ${file.size || 0}，实际 ${blob.size}）`);
      }
      prepared.push({ record: file, blob });
    } catch (error) {
      throw new Error(`${file.name}: ${error?.message || error}`);
    }
    await backupYield();
  }
  return prepared;
}

function backupBaseManifest(state, mode) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    mode,
    scope: state.scope,
    app: "文档小助手",
    createdAt: new Date().toISOString(),
    folders: state.folders.map(folder => ({
      name: normalizeFolderName(folder.name),
      isPrivate: !!folder.isPrivate
    })).filter(folder => folder.name),
    files: []
  };
}

function backupFileMetadata(item) {
  const file = item.record;
  return {
    name: String(file.name || "file").slice(0, 255),
    type: String(file.type || item.blob.type || "application/octet-stream").slice(0, 200),
    size: item.blob.size,
    contentSize: item.blob.size,
    isPrivate: !!file.isPrivate,
    uploadedAt: Number(file.uploadedAt || Date.now()),
    folder: normalizeFolderName(file.folder)
  };
}

function backupFileMetadataFromRecord(file) {
  const size = Number(file.size || 0);
  return {
    name: String(file.name || "file").slice(0, 255),
    type: String(file.type || "application/octet-stream").slice(0, 200),
    size,
    contentSize: size,
    isPrivate: !!file.isPrivate,
    uploadedAt: Number(file.uploadedAt || Date.now()),
    folder: normalizeFolderName(file.folder)
  };
}

async function runBackupExport(state, mode, password, downloadName) {
  const files = state.files;
  const totalSteps = Math.max(1, files.length * 2 + 2);
  try {
    let output;
    if (mode === "plain") {
      const prepared = await backupPrepareFiles(files, totalSteps);
      output = await backupBuildPlainZip(state, prepared, totalSteps);
    } else {
      output = await backupBuildEncryptedContainer(
        state,
        files,
        password,
        totalSteps,
        async file => ({ record: file, blob: await backupPlainBlobForFile(file) })
      );
    }
    backupSetProgress(totalSteps, totalSteps, downloadName, "备份已生成");
    backupDownloadBlob(output, downloadName);
    toast(`已导出 ${files.length} 个文件`, "success");
  } catch (error) {
    console.error("[backup-export]", error);
    toast("备份导出失败: " + (error?.message || error), "error");
    throw error;
  } finally {
    backupHideProgress();
  }
}

let backupCrcTable = null;
function backupGetCrcTable() {
  if (backupCrcTable) return backupCrcTable;
  backupCrcTable = new Uint32Array(256);
  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
    backupCrcTable[index] = value >>> 0;
  }
  return backupCrcTable;
}

async function backupCrc32Blob(blob) {
  const table = backupGetCrcTable();
  let crc = 0xffffffff;
  for (let offset = 0; offset < blob.size; offset += BACKUP_IO_CHUNK_BYTES) {
    const bytes = new Uint8Array(await blob.slice(offset, offset + BACKUP_IO_CHUNK_BYTES).arrayBuffer());
    for (let index = 0; index < bytes.length; index++) crc = (crc >>> 8) ^ table[(crc ^ bytes[index]) & 0xff];
    await backupYield();
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function backupDosDateTime(value) {
  const date = new Date(value || Date.now());
  const year = Math.min(2107, Math.max(1980, date.getFullYear()));
  return {
    time: ((date.getHours() & 31) << 11) | ((date.getMinutes() & 63) << 5) | ((Math.floor(date.getSeconds() / 2)) & 31),
    date: (((year - 1980) & 127) << 9) | (((date.getMonth() + 1) & 15) << 5) | (date.getDate() & 31)
  };
}

function backupZipLocalHeader(nameBytes, dateTime) {
  const bytes = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0808, true); // UTF-8 + data descriptor
  view.setUint16(8, 0, true); // STORE
  view.setUint16(10, dateTime.time, true);
  view.setUint16(12, dateTime.date, true);
  view.setUint16(26, nameBytes.length, true);
  bytes.set(nameBytes, 30);
  return bytes;
}

function backupZipDescriptor(crc32, size) {
  const bytes = new Uint8Array(16);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x08074b50, true);
  view.setUint32(4, crc32, true);
  view.setUint32(8, size, true);
  view.setUint32(12, size, true);
  return bytes;
}

function backupZipCentralHeader(nameBytes, dateTime, crc32, size, localOffset) {
  const bytes = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 0x0314, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0808, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, dateTime.time, true);
  view.setUint16(14, dateTime.date, true);
  view.setUint32(16, crc32, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint32(42, localOffset, true);
  bytes.set(nameBytes, 46);
  return bytes;
}

function backupZipEnd(entryCount, centralSize, centralOffset) {
  const bytes = new Uint8Array(22);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  return bytes;
}

async function backupBuildStoreZip(entries, progressStart, totalSteps) {
  if (entries.length > 0xffff) throw new Error("备份文件数量超过 ZIP 格式上限");
  const encoder = new TextEncoder();
  const bodyParts = [];
  const centralParts = [];
  let offset = 0;

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    if (entry.blob.size > BACKUP_ZIP_UINT32_MAX) throw new Error(`${entry.name}: 单个文件超过 4GB，当前 ZIP 格式不支持`);
    const nameBytes = encoder.encode(entry.name);
    if (nameBytes.length > 0xffff) throw new Error(`${entry.name}: ZIP 路径过长`);
    const dateTime = backupDosDateTime(entry.date);
    const crc32 = await backupCrc32Blob(entry.blob);
    const local = backupZipLocalHeader(nameBytes, dateTime);
    const descriptor = backupZipDescriptor(crc32, entry.blob.size);
    if (offset + local.length + entry.blob.size + descriptor.length > BACKUP_ZIP_UINT32_MAX) {
      throw new Error("备份总大小超过 4GB，当前 ZIP 格式不支持，请分批勾选导出");
    }
    bodyParts.push(local, entry.blob, descriptor);
    centralParts.push(backupZipCentralHeader(nameBytes, dateTime, crc32, entry.blob.size, offset));
    offset += local.length + entry.blob.size + descriptor.length;
    backupSetProgress(progressStart + index + 1, totalSteps, entry.name, "正在生成普通 ZIP");
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  if (centralOffset + centralSize + 22 > BACKUP_ZIP_UINT32_MAX) throw new Error("备份总大小超过 ZIP 格式上限");
  return new Blob([...bodyParts, ...centralParts, backupZipEnd(entries.length, centralSize, centralOffset)], { type: "application/zip" });
}

async function backupBuildPlainZip(state, prepared, totalSteps) {
  const manifest = backupBaseManifest(state, "plain");
  const usedPaths = new Set([BACKUP_MANIFEST_PATH.toLocaleLowerCase(), "备份说明.txt".toLocaleLowerCase()]);
  const fileEntries = prepared.map(item => {
    const meta = backupFileMetadata(item);
    const folder = meta.folder ? backupSafeArchiveSegment(meta.folder, "folder") + "/" : "";
    meta.archivePath = backupMakeUniquePath(`files/${folder}${backupSafeArchiveSegment(meta.name)}`, usedPaths);
    manifest.files.push(meta);
    return { name: meta.archivePath, blob: item.blob, date: meta.uploadedAt };
  });

  const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
  const readme = new Blob([
    "文档小助手普通备份\r\n",
    "\r\nfiles 文件夹内为可直接打开的原始文件。\r\n",
    "请保留 .pic-manage-backup/manifest.json，以便在应用中恢复文件夹和私密属性。\r\n"
  ], { type: "text/plain;charset=utf-8" });
  const entries = [
    { name: BACKUP_MANIFEST_PATH, blob: manifestBlob, date: Date.now() },
    { name: "备份说明.txt", blob: readme, date: Date.now() },
    ...fileEntries
  ];
  return backupBuildStoreZip(entries, prepared.length, totalSteps);
}

function backupEncryptedHeader(salt, iterations, chunkSize, manifestLength, manifestIv) {
  const bytes = new Uint8Array(BACKUP_ENCRYPTED_HEADER_BYTES);
  bytes.set(BACKUP_ENCRYPTED_MAGIC, 0);
  bytes.set(salt, 8);
  const view = new DataView(bytes.buffer);
  view.setUint32(24, iterations, true);
  view.setUint32(28, chunkSize, true);
  view.setUint32(32, manifestLength, true);
  bytes.set(manifestIv, 36);
  return bytes;
}

function backupEncryptedFrameHeader(iv, encryptedLength) {
  const bytes = new Uint8Array(16);
  bytes.set(iv, 0);
  new DataView(bytes.buffer).setUint32(12, encryptedLength, true);
  return bytes;
}

async function backupBuildEncryptedContainer(state, sources, password, totalSteps, sourceFactory = null) {
  const manifest = backupBaseManifest(state, "encrypted");
  sources.forEach(source => {
    const record = sourceFactory ? source : source.record;
    const meta = sourceFactory ? backupFileMetadataFromRecord(record) : backupFileMetadata(source);
    meta.chunkCount = Math.ceil(meta.contentSize / BACKUP_ENCRYPT_CHUNK_BYTES);
    manifest.files.push(meta);
  });

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await backupDeriveKey(password, salt, BACKUP_KDF_ITERATIONS);
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  if (manifestBytes.length > BACKUP_MAX_MANIFEST_BYTES) throw new Error("备份清单过大");
  const manifestIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedManifest = await crypto.subtle.encrypt({ name: "AES-GCM", iv: manifestIv }, key, manifestBytes);
  const parts = [
    backupEncryptedHeader(salt, BACKUP_KDF_ITERATIONS, BACKUP_ENCRYPT_CHUNK_BYTES, encryptedManifest.byteLength, manifestIv),
    encryptedManifest
  ];

  for (let fileIndex = 0; fileIndex < sources.length; fileIndex++) {
    const source = sources[fileIndex];
    const record = sourceFactory ? source : source.record;
    backupSetProgress(fileIndex * 2, totalSteps, record.name, "正在读取备份文件");
    const item = sourceFactory ? await sourceFactory(source, fileIndex) : source;
    if (!(item.blob instanceof Blob) || item.blob.size !== manifest.files[fileIndex].contentSize) {
      throw new Error(`${record.name}: 文件大小校验失败`);
    }
    backupSetProgress(fileIndex * 2 + 1, totalSteps, record.name, "正在生成加密备份");
    for (let offset = 0; offset < item.blob.size; offset += BACKUP_ENCRYPT_CHUNK_BYTES) {
      const plain = await item.blob.slice(offset, offset + BACKUP_ENCRYPT_CHUNK_BYTES).arrayBuffer();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
      parts.push(backupEncryptedFrameHeader(iv, encrypted.byteLength), encrypted);
      await backupYield();
    }
    backupSetProgress(fileIndex * 2 + 2, totalSteps, record.name, "正在生成加密备份");
  }
  return new Blob(parts, { type: "application/x-pic-manage-backup" });
}

function backupDownloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function triggerBackupImport() {
  if (backupBusy) return;
  const input = document.getElementById("backupFileInput");
  input.value = "";
  input.click();
}

function closeBackupImportPassword() {
  if (backupBusy) return;
  document.getElementById("backupImportPasswordDialog").classList.remove("active");
  document.getElementById("backupImportPassword").value = "";
  document.getElementById("backupImportPasswordError").textContent = "";
  backupImportPendingFile = null;
}

function backupMatchesMagic(bytes) {
  return bytes.length >= BACKUP_ENCRYPTED_MAGIC.length
    && BACKUP_ENCRYPTED_MAGIC.every((value, index) => bytes[index] === value);
}

async function backupHandleImportFile(file) {
  if (!file || backupBusy) return;
  closeSettings();
  const head = new Uint8Array(await file.slice(0, BACKUP_ENCRYPTED_MAGIC.length).arrayBuffer());
  if (backupMatchesMagic(head)) {
    backupImportPendingFile = file;
    document.getElementById("backupImportFileLabel").textContent = `${file.name} · ${fmtSize(file.size)}`;
    document.getElementById("backupImportPassword").value = "";
    document.getElementById("backupImportPasswordError").textContent = "";
    document.getElementById("backupImportPasswordDialog").classList.add("active");
    setTimeout(() => document.getElementById("backupImportPassword").focus(), 80);
    return;
  }
  if (head.length >= 4 && head[0] === 0x50 && head[1] === 0x4b) {
    await backupImportPlainZip(file);
    return;
  }
  toast("无法识别该备份文件，请选择 .pmbak 或本程序导出的 ZIP", "error");
}

async function confirmEncryptedBackupImport() {
  if (backupBusy || !backupImportPendingFile) return;
  const password = document.getElementById("backupImportPassword").value;
  if (!password) {
    document.getElementById("backupImportPasswordError").textContent = "请输入备份密码";
    return;
  }
  backupBusy = true;
  document.getElementById("backupImportConfirmBtn").disabled = true;
  document.getElementById("backupImportPasswordError").textContent = "";
  try {
    const source = await backupOpenEncryptedContainer(backupImportPendingFile, password);
    if (!backupConfirmRestore(source.manifest)) return;
    document.getElementById("backupImportPasswordDialog").classList.remove("active");
    await backupRestoreManifest(source.manifest, source.getFileBlob);
    backupImportPendingFile = null;
    document.getElementById("backupImportPassword").value = "";
  } catch (error) {
    console.error("[backup-import-encrypted]", error);
    const message = error?.name === "OperationError"
      ? "密码错误或备份文件已损坏"
      : (error?.message || String(error));
    document.getElementById("backupImportPasswordError").textContent = message;
    toast("恢复失败: " + message, "error");
  } finally {
    backupBusy = false;
    document.getElementById("backupImportConfirmBtn").disabled = false;
    backupHideProgress();
  }
}

function backupFindZipEnd(bytes) {
  if (bytes.length < 22) return -1;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = bytes.length - 22; offset >= 0; offset--) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  return -1;
}

async function backupOpenZip(blob) {
  const tailStart = Math.max(0, blob.size - (0xffff + 22));
  const tail = new Uint8Array(await blob.slice(tailStart).arrayBuffer());
  const endOffset = backupFindZipEnd(tail);
  if (endOffset < 0) throw new Error("ZIP 目录不存在或文件不完整");
  const endView = new DataView(tail.buffer, tail.byteOffset + endOffset, tail.length - endOffset);
  const disk = endView.getUint16(4, true);
  const centralDisk = endView.getUint16(6, true);
  const entryCount = endView.getUint16(10, true);
  const centralSize = endView.getUint32(12, true);
  const centralOffset = endView.getUint32(16, true);
  if (disk || centralDisk) throw new Error("不支持分卷 ZIP 备份");
  if (entryCount === 0xffff || centralSize === BACKUP_ZIP_UINT32_MAX || centralOffset === BACKUP_ZIP_UINT32_MAX) {
    throw new Error("暂不支持 ZIP64 备份");
  }
  if (centralOffset + centralSize > blob.size || centralSize > 128 * 1024 * 1024) throw new Error("ZIP 中央目录无效");

  const bytes = new Uint8Array(await blob.slice(centralOffset, centralOffset + centralSize).arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder("utf-8");
  const entries = [];
  let cursor = 0;
  while (cursor + 46 <= bytes.length && entries.length < entryCount) {
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error("ZIP 中央目录条目无效");
    const flags = view.getUint16(cursor + 8, true);
    const method = view.getUint16(cursor + 10, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const next = cursor + 46 + nameLength + extraLength + commentLength;
    if (next > bytes.length) throw new Error("ZIP 目录条目不完整");
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    entries.push({
      name,
      flags,
      method,
      crc32: view.getUint32(cursor + 16, true),
      compressedSize: view.getUint32(cursor + 20, true),
      uncompressedSize: view.getUint32(cursor + 24, true),
      localOffset: view.getUint32(cursor + 42, true)
    });
    cursor = next;
  }
  if (entries.length !== entryCount) throw new Error("ZIP 文件数量校验失败");
  return { blob, entries, byName: new Map(entries.map(entry => [entry.name, entry])) };
}

async function backupExtractZipEntry(archive, entry, type = "application/octet-stream") {
  if (!entry) throw new Error("备份中的文件条目不存在");
  if (entry.flags & 1) throw new Error(`${entry.name}: 不支持 ZIP 自带加密`);
  const header = new Uint8Array(await archive.blob.slice(entry.localOffset, entry.localOffset + 30).arrayBuffer());
  if (header.length < 30 || new DataView(header.buffer).getUint32(0, true) !== 0x04034b50) throw new Error(`${entry.name}: ZIP 文件头无效`);
  const view = new DataView(header.buffer);
  const dataStart = entry.localOffset + 30 + view.getUint16(26, true) + view.getUint16(28, true);
  const dataEnd = dataStart + entry.compressedSize;
  if (dataEnd > archive.blob.size) throw new Error(`${entry.name}: ZIP 数据不完整`);

  if (entry.method === 0) {
    if (entry.compressedSize !== entry.uncompressedSize) throw new Error(`${entry.name}: ZIP 大小无效`);
    const output = archive.blob.slice(dataStart, dataEnd, type);
    const crc32 = await backupCrc32Blob(output);
    if (crc32 !== entry.crc32) throw new Error(`${entry.name}: ZIP CRC 校验失败`);
    return output;
  }
  if (entry.method === 8) {
    const compressed = new Uint8Array(await archive.blob.slice(dataStart, dataEnd).arrayBuffer());
    const output = pako.inflateRaw(compressed);
    if (output.length !== entry.uncompressedSize) throw new Error(`${entry.name}: ZIP 解压大小校验失败`);
    const outputBlob = new Blob([output], { type });
    const crc32 = await backupCrc32Blob(outputBlob);
    if (crc32 !== entry.crc32) throw new Error(`${entry.name}: ZIP CRC 校验失败`);
    return outputBlob;
  }
  throw new Error(`${entry.name}: 不支持 ZIP 压缩方式 ${entry.method}`);
}

async function backupImportPlainZip(file) {
  if (backupBusy) return;
  backupBusy = true;
  try {
    backupSetProgress(0, 1, file.name, "正在读取备份");
    const archive = await backupOpenZip(file);
    const manifestEntry = archive.byName.get(BACKUP_MANIFEST_PATH);
    if (!manifestEntry || manifestEntry.uncompressedSize > BACKUP_MAX_MANIFEST_BYTES) {
      throw new Error("这不是本程序导出的普通备份 ZIP");
    }
    const manifestBlob = await backupExtractZipEntry(archive, manifestEntry, "application/json");
    const manifest = JSON.parse(await manifestBlob.text());
    backupValidateManifest(manifest, "plain");
    if (!backupConfirmRestore(manifest)) return;
    await backupRestoreManifest(manifest, meta => {
      const entry = archive.byName.get(meta.archivePath);
      return backupExtractZipEntry(archive, entry, meta.type);
    });
  } catch (error) {
    console.error("[backup-import-zip]", error);
    toast("备份导入失败: " + (error?.message || error), "error");
  } finally {
    backupBusy = false;
    backupHideProgress();
  }
}

async function backupOpenEncryptedContainer(blob, password) {
  const header = new Uint8Array(await blob.slice(0, BACKUP_ENCRYPTED_HEADER_BYTES).arrayBuffer());
  if (header.length !== BACKUP_ENCRYPTED_HEADER_BYTES || !backupMatchesMagic(header)) throw new Error("加密备份文件头无效");
  const view = new DataView(header.buffer);
  const iterations = view.getUint32(24, true);
  const chunkSize = view.getUint32(28, true);
  const manifestLength = view.getUint32(32, true);
  if (iterations < 10000 || iterations > 2000000) throw new Error("加密备份 KDF 参数无效");
  if (!chunkSize || chunkSize > 64 * 1024 * 1024) throw new Error("加密备份分块大小无效");
  if (manifestLength < 17 || manifestLength > BACKUP_MAX_MANIFEST_BYTES + 16) throw new Error("加密备份清单长度无效");
  if (BACKUP_ENCRYPTED_HEADER_BYTES + manifestLength > blob.size) throw new Error("加密备份不完整");

  const key = await backupDeriveKey(password, header.slice(8, 24), iterations);
  const encryptedManifest = await blob.slice(BACKUP_ENCRYPTED_HEADER_BYTES, BACKUP_ENCRYPTED_HEADER_BYTES + manifestLength).arrayBuffer();
  const manifestPlain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: header.slice(36, 48) },
    key,
    encryptedManifest
  );
  const manifest = JSON.parse(new TextDecoder().decode(manifestPlain));
  backupValidateManifest(manifest, "encrypted");

  let cursor = BACKUP_ENCRYPTED_HEADER_BYTES + manifestLength;
  const offsets = [];
  for (const meta of manifest.files) {
    const expectedChunks = Math.ceil(meta.contentSize / chunkSize);
    if (meta.chunkCount !== expectedChunks) throw new Error(`${meta.name}: 加密分块数量无效`);
    offsets.push(cursor);
    cursor += meta.contentSize + meta.chunkCount * 32;
    if (cursor > blob.size) throw new Error(`${meta.name}: 加密备份内容不完整`);
  }
  if (cursor !== blob.size) throw new Error("加密备份尾部长度不匹配");

  return {
    manifest,
    getFileBlob: (meta, requestedIndex) => {
      const index = Number.isInteger(requestedIndex) ? requestedIndex : manifest.files.indexOf(meta);
      if (index < 0 || index >= offsets.length) throw new Error(`${meta?.name || "文件"}: 加密备份索引无效`);
      return backupDecryptContainerFile(blob, key, meta, offsets[index], chunkSize);
    }
  };
}

async function backupDecryptContainerFile(container, key, meta, startOffset, chunkSize) {
  const parts = [];
  let cursor = startOffset;
  let total = 0;
  for (let index = 0; index < meta.chunkCount; index++) {
    const frameHeader = new Uint8Array(await container.slice(cursor, cursor + 16).arrayBuffer());
    if (frameHeader.length !== 16) throw new Error(`${meta.name}: 加密分块头不完整`);
    const encryptedLength = new DataView(frameHeader.buffer).getUint32(12, true);
    const expectedPlain = Math.min(chunkSize, meta.contentSize - total);
    if (encryptedLength !== expectedPlain + 16) throw new Error(`${meta.name}: 加密分块长度无效`);
    cursor += 16;
    const encrypted = await container.slice(cursor, cursor + encryptedLength).arrayBuffer();
    if (encrypted.byteLength !== encryptedLength) throw new Error(`${meta.name}: 加密分块不完整`);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: frameHeader.slice(0, 12) },
      key,
      encrypted
    );
    if (plain.byteLength !== expectedPlain) throw new Error(`${meta.name}: 解密大小校验失败`);
    parts.push(plain);
    total += plain.byteLength;
    cursor += encryptedLength;
    await backupYield();
  }
  if (total !== meta.contentSize) throw new Error(`${meta.name}: 文件大小校验失败`);
  return new Blob(parts, { type: meta.type || "application/octet-stream" });
}

function backupValidateManifest(manifest, expectedMode) {
  if (!manifest || manifest.format !== BACKUP_FORMAT || manifest.version !== BACKUP_VERSION) throw new Error("备份格式或版本不受支持");
  if (manifest.mode !== expectedMode || !Array.isArray(manifest.files) || !Array.isArray(manifest.folders)) throw new Error("备份清单无效");
  if (manifest.files.length > 10000 || manifest.folders.length > 10000) throw new Error("备份条目数量异常");
  manifest.folders = manifest.folders.map(folder => ({
    name: normalizeFolderName(folder?.name),
    isPrivate: !!folder?.isPrivate
  })).filter(folder => folder.name);

  manifest.files = manifest.files.map(file => {
    const contentSize = Number(file?.contentSize);
    if (!file?.name || !Number.isSafeInteger(contentSize) || contentSize < 0) throw new Error("备份文件信息无效");
    const meta = {
      name: String(file.name).slice(0, 255),
      type: String(file.type || "application/octet-stream").slice(0, 200),
      size: contentSize,
      contentSize,
      isPrivate: !!file.isPrivate,
      uploadedAt: Number.isFinite(Number(file.uploadedAt)) ? Number(file.uploadedAt) : Date.now(),
      folder: normalizeFolderName(file.folder)
    };
    if (expectedMode === "plain") {
      if (!file.archivePath || typeof file.archivePath !== "string") throw new Error(`${meta.name}: ZIP 路径缺失`);
      meta.archivePath = file.archivePath;
    } else {
      if (!Number.isSafeInteger(Number(file.chunkCount)) || Number(file.chunkCount) < 0) throw new Error(`${meta.name}: 分块信息无效`);
      meta.chunkCount = Number(file.chunkCount);
    }
    return meta;
  });
  return manifest;
}

function backupManifestNeedsAdmin(manifest) {
  return manifest.files.some(file => file.isPrivate) || manifest.folders.some(folder => folder.isPrivate);
}

function backupConfirmRestore(manifest) {
  if (backupManifestNeedsAdmin(manifest) && (!isAdmin || !adminKey)) {
    toast("该备份包含私密内容，请先进入管理员模式后再导入", "error");
    return false;
  }
  const totalBytes = manifest.files.reduce((sum, file) => sum + file.contentSize, 0);
  return confirm(`备份包含 ${manifest.files.length} 个文件（${fmtSize(totalBytes)}）。\n恢复不会覆盖现有文件；同名文件会自动保留为副本。\n\n是否开始恢复？`);
}

function backupUniqueFolderName(base, usedNames) {
  let candidate = base;
  let index = 2;
  while (usedNames.has(candidate.toLocaleLowerCase())) candidate = `${base} (恢复 ${index++})`;
  usedNames.add(candidate.toLocaleLowerCase());
  return candidate;
}

function backupBuildFolderRestorePlan(manifest, existingFiles) {
  const originalRecords = getCustomFolderRecords();
  const recordByName = new Map(originalRecords.map(record => [record.name, record]));
  const usedNames = new Set(getAllFolderNames(existingFiles).map(name => name.toLocaleLowerCase()));
  const desired = new Map();
  manifest.folders.forEach(folder => desired.set(folder.name, !!folder.isPrivate));
  manifest.files.filter(file => file.folder).forEach(file => {
    if (!desired.has(file.folder)) desired.set(file.folder, false);
  });

  const folderMap = new Map();
  const newRecords = originalRecords.map(record => ({ ...record }));
  desired.forEach((privateFolder, sourceName) => {
    const existing = recordByName.get(sourceName);
    const nameExists = usedNames.has(sourceName.toLocaleLowerCase());
    let targetName = sourceName;
    if (nameExists && !!existing?.isPrivate !== privateFolder) {
      targetName = backupUniqueFolderName(`${sourceName} (恢复)`, usedNames);
    } else if (!nameExists) {
      usedNames.add(sourceName.toLocaleLowerCase());
    }
    folderMap.set(sourceName, targetName);
    if (!newRecords.some(record => record.name === targetName)) {
      newRecords.push({ name: targetName, isPrivate: privateFolder });
    }
  });
  return { originalRecords, newRecords, folderMap };
}

function backupUniqueRestoredFileName(name, folder, usedNames) {
  const folderKey = String(folder || "").toLocaleLowerCase();
  const keyFor = value => `${folderKey}\u0000${String(value).toLocaleLowerCase()}`;
  let candidate = name;
  let index = 2;
  if (!usedNames.has(keyFor(candidate))) {
    usedNames.add(keyFor(candidate));
    return candidate;
  }
  do {
    candidate = backupAppendNameSuffix(name, ` (恢复 ${index++})`);
  } while (usedNames.has(keyFor(candidate)));
  usedNames.add(keyFor(candidate));
  return candidate;
}

async function backupStoreRestoredFile(meta, sourceBlob, folder, name) {
  let stored = sourceBlob;
  if (meta.isPrivate) {
    if (!adminKey) throw new Error("管理员会话已过期");
    if (sourceBlob.size > PRIVATE_CHUNKED_ENCRYPT_BYTES) {
      stored = await encryptBlobChunked(sourceBlob, adminKey);
    } else {
      stored = new Blob([await encryptBuf(await sourceBlob.arrayBuffer(), adminKey)]);
    }
  }
  return dbAdd({
    name,
    folder: folder || undefined,
    size: sourceBlob.size,
    type: meta.type || sourceBlob.type || "application/octet-stream",
    isPrivate: !!meta.isPrivate,
    uploadedAt: meta.uploadedAt,
    data: stored
  });
}

async function backupRestoreManifest(manifest, getFileBlob) {
  const existingFiles = await dbAll();
  const folderPlan = backupBuildFolderRestorePlan(manifest, existingFiles);
  const usedNames = new Set(existingFiles.map(file => `${String(file.folder || "").toLocaleLowerCase()}\u0000${String(file.name || "").toLocaleLowerCase()}`));
  const addedIds = [];
  saveCustomFolderRecords(folderPlan.newRecords);
  backupSetProgress(0, Math.max(1, manifest.files.length), "", "正在恢复备份");

  try {
    for (let index = 0; index < manifest.files.length; index++) {
      const meta = manifest.files[index];
      backupSetProgress(index, manifest.files.length, meta.name, "正在恢复备份");
      const sourceBlob = await getFileBlob(meta, index);
      if (!(sourceBlob instanceof Blob) || sourceBlob.size !== meta.contentSize) {
        throw new Error(`${meta.name}: 备份文件大小校验失败`);
      }
      const folder = meta.folder ? (folderPlan.folderMap.get(meta.folder) || meta.folder) : null;
      const name = backupUniqueRestoredFileName(meta.name, folder, usedNames);
      const id = await backupStoreRestoredFile(meta, sourceBlob, folder, name);
      addedIds.push(id);
      scheduleImportedCover(id, name, sourceBlob);
      await backupYield();
    }
    backupSetProgress(manifest.files.length, manifest.files.length, "恢复完成", "备份恢复完成");
    currentFolder = null;
    refreshFileList();
    toast(`已恢复 ${addedIds.length} 个文件，现有文件未被覆盖`, "success");
    return addedIds.length;
  } catch (error) {
    if (addedIds.length) await dbDeleteFiles(addedIds).catch(rollbackError => console.error("[backup-rollback-files]", rollbackError));
    saveCustomFolderRecords(folderPlan.originalRecords);
    refreshFileList();
    throw error;
  }
}

function initBackupUI() {
  const input = document.getElementById("backupFileInput");
  input?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) backupHandleImportFile(file).catch(error => {
      console.error("[backup-import]", error);
      toast("备份导入失败: " + (error?.message || error), "error");
      backupBusy = false;
      backupHideProgress();
    });
  });

  document.getElementById("backupImportPassword")?.addEventListener("keydown", event => {
    if (event.key === "Enter") confirmEncryptedBackupImport();
  });
}

window.addEventListener("DOMContentLoaded", initBackupUI);
