const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const context = vm.createContext({
  console,
  Blob,
  TextEncoder,
  TextDecoder,
  crypto: webcrypto,
  setTimeout,
  clearTimeout,
  Map,
  Set,
  Uint8Array,
  Uint32Array,
  ArrayBuffer,
  DataView,
  Date,
  Math,
  Number,
  String,
  Promise,
  JSON,
  RegExp,
  Error,
  URL: { createObjectURL() {}, revokeObjectURL() {} },
  document: {
    getElementById() { return { textContent: "", classList: { add() {}, remove() {}, toggle() {} } }; },
    createElement() { return { click() {}, remove() {}, set href(_) {}, set download(_) {}, set rel(_) {} }; },
    body: { appendChild() {} }
  },
  updateImportProgress() {},
  hideImportProgress() {},
  normalizeFolderName(value) { return String(value || "").trim().slice(0, 80) || null; },
  t(value) { return value; }
});
context.window = context;
context.window.addEventListener = () => {};

const source = fs.readFileSync(path.join(__dirname, "..", "backup.js"), "utf8");
vm.runInContext(source, context, { filename: "backup.js" });

async function blobText(blob) {
  return Buffer.from(await blob.arrayBuffer()).toString("utf8");
}

async function testPlainZipRoundTrip() {
  const entries = [
    { name: ".pic-manage-backup/manifest.json", blob: new Blob(["{\"ok\":true}"]), date: Date.now() },
    { name: "files/分类/示例.txt", blob: new Blob(["hello backup"]), date: Date.now() },
    { name: "files/empty.bin", blob: new Blob([]), date: Date.now() }
  ];
  const zip = await context.backupBuildStoreZip(entries, 0, entries.length);
  assert.equal(zip.type, "application/zip");
  if (process.env.BACKUP_TEST_ZIP) {
    fs.writeFileSync(process.env.BACKUP_TEST_ZIP, Buffer.from(await zip.arrayBuffer()));
  }
  const archive = await context.backupOpenZip(zip);
  assert.equal(archive.entries.length, entries.length);
  const restored = await context.backupExtractZipEntry(
    archive,
    archive.byName.get("files/分类/示例.txt"),
    "text/plain"
  );
  assert.equal(await blobText(restored), "hello backup");
  const empty = await context.backupExtractZipEntry(archive, archive.byName.get("files/empty.bin"));
  assert.equal(empty.size, 0);
}

async function testEncryptedRoundTrip() {
  const state = { scope: "all", folders: [{ name: "私密", isPrivate: true }] };
  const prepared = [
    {
      record: { name: "秘密.txt", type: "text/plain", size: 14, isPrivate: true, folder: "私密", uploadedAt: 123 },
      blob: new Blob(["secret content"], { type: "text/plain" })
    },
    {
      record: { name: "空文件.bin", type: "application/octet-stream", size: 0, isPrivate: false, uploadedAt: 456 },
      blob: new Blob([])
    }
  ];
  const encrypted = await context.backupBuildEncryptedContainer(state, prepared, "correct horse", 10);
  const opened = await context.backupOpenEncryptedContainer(encrypted, "correct horse");
  assert.equal(opened.manifest.files.length, 2);
  // Re-normalizing the manifest creates new metadata objects. Stable numeric
  // indexes must still resolve the correct encrypted payload.
  context.backupValidateManifest(opened.manifest, "encrypted");
  const restored = await opened.getFileBlob(opened.manifest.files[0], 0);
  assert.equal(await blobText(restored), "secret content");
  const empty = await opened.getFileBlob(opened.manifest.files[1], 1);
  assert.equal(empty.size, 0);
  await assert.rejects(() => context.backupOpenEncryptedContainer(encrypted, "wrong password"));

  const emptyBackup = await context.backupBuildEncryptedContainer(
    { scope: "all", folders: [{ name: "空文件夹", isPrivate: false }] },
    [],
    "correct horse",
    1
  );
  const emptyOpened = await context.backupOpenEncryptedContainer(emptyBackup, "correct horse");
  assert.equal(emptyOpened.manifest.files.length, 0);
  assert.equal(emptyOpened.manifest.folders[0].name, "空文件夹");

  const rangePayload = new Blob(["range-reader-content"], { type: "text/plain" });
  const rangeSource = {
    name: "range.txt",
    type: "text/plain",
    size: rangePayload.size,
    isPrivate: false,
    uploadedAt: 789
  };
  const rangedBackup = await context.backupBuildEncryptedContainer(
    {
      scope: "all",
      folders: [],
      volume: { id: "test-volume", index: 1, count: 2, totalFiles: 1, totalBytes: rangePayload.size }
    },
    [rangeSource],
    "correct horse",
    4,
    async source => ({
      record: source,
      size: source.size,
      read: (start, end) => rangePayload.slice(start, end).arrayBuffer()
    })
  );
  const rangedOpened = await context.backupOpenEncryptedContainer(rangedBackup, "correct horse");
  assert.equal(rangedOpened.manifest.volume.index, 1);
  assert.equal(rangedOpened.manifest.volume.count, 2);
  assert.equal(await blobText(await rangedOpened.getFileBlob(rangedOpened.manifest.files[0], 0)), "range-reader-content");

  await assert.rejects(
    () => context.backupBuildEncryptedContainer(
      { scope: "all", folders: [] },
      [rangeSource],
      "correct horse",
      4,
      async source => ({
        record: source,
        size: source.size,
        read: () => new Uint8Array(1)
      })
    ),
    /读取到的文件分块不完整/
  );
}

function testExportSizeValidation() {
  assert.equal(
    context.backupValidateExportBlob(new Blob([new Uint8Array(1024)]), [{ size: 1024 }], "full.zip").size,
    1024
  );
  assert.throws(
    () => context.backupValidateExportBlob(new Blob([new Uint8Array(100)]), [{ size: 1024 }], "full.zip"),
    /导出文件不完整/
  );
}

async function testPrivateExportCredentialSnapshot() {
  let credentialSeen = null;
  context.dbReadStoredRange = async () => new Uint8Array(28);
  context.isChunkedEncryptedData = () => true;
  context.readUint32FromBytes = () => 4;
  context.deriveKey = async credential => {
    credentialSeen = credential;
    return {};
  };

  const reader = await context.backupCreatePlainFileReader(
    { id: 7, name: "private.bin", size: 4, isPrivate: true },
    "captured-admin-key"
  );
  assert.equal(credentialSeen, "captured-admin-key");
  assert.equal(reader.size, 4);
}

function testLargeExportVolumePlan() {
  const mib = 1024 * 1024;
  const files = [
    { name: "a.bin", size: 180 * mib },
    { name: "b.bin", size: 180 * mib },
    { name: "c.bin", size: 80 * mib },
    { name: "large.bin", size: 325 * mib },
    { name: "d.bin", size: 10 * mib }
  ];
  const volumes = context.backupPlanVolumes(files, 256 * mib);
  assert.equal(JSON.stringify(volumes.map(volume => volume.map(file => file.name))), JSON.stringify([
    ["a.bin"],
    ["b.bin"],
    ["c.bin"],
    ["large.bin", "d.bin"]
  ]));

  const tinyLeadingVolume = context.backupPlanVolumes([
    { name: "metadata.log", size: 100 * 1024 },
    { name: "archive.bin", size: 325 * mib }
  ], 256 * mib);
  assert.equal(JSON.stringify(tinyLeadingVolume.map(volume => volume.map(file => file.name))), JSON.stringify([
    ["metadata.log", "archive.bin"]
  ]));
  assert.equal(context.backupVolumeDownloadName("full.zip", 0, 12), "full.part-01-of-12.zip");
  assert.equal(context.backupVolumeDownloadName("full.pmbak", 11, 12), "full.part-12-of-12.pmbak");
}

(async () => {
  await testPlainZipRoundTrip();
  await testEncryptedRoundTrip();
  testExportSizeValidation();
  await testPrivateExportCredentialSnapshot();
  testLargeExportVolumePlan();
  console.log("Backup format tests passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
