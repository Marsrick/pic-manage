/* ===== COMIC READER STATE ===== */
let readerPages = [];
let readerImageBlobs = [];
const READER_URL_WINDOW = 6;
let readerName = "";
let rPageIdx = 0;
let rMode = "click"; // click | flip | slide | webtoon
let rAutoPlaying = false;
let rAutoTimer = null;
let rAutoSpeed = 3;
let isFlipping = false;
let readerImageZoomed = false;
let pageFlipBook = null;
let pageFlipInitSeq = 0;
let pageFlipRenderUrls = [];
let readerOpenSeq = 0;
let readerExtractWorker = null;
let readerLazyWorker = null;
let readerLazyPending = new Map();
let readerLazyPageNames = [];
let readerLazyMode = false;
let readerLargeModeLocked = false;
const READER_LAZY_ZIP_BYTES = 16 * 1024 * 1024;
const READER_HEAVY_MODE_PAGE_LIMIT = 80;
const READER_HEAVY_MODE_BYTES = 48 * 1024 * 1024;
const READER_PAGE_PREFETCH_BYTES = 8 * 1024 * 1024;
const READER_LARGE_ARCHIVE_BYTES = 180 * 1024 * 1024;
const READER_PLACEHOLDER_SRC = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 460"><rect width="320" height="460" fill="#f8fafc"/><g fill="none" stroke="#cbd5e1" stroke-width="10" stroke-linecap="round"><path d="M95 210h130"/><path d="M115 245h90"/></g><text x="160" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#94a3b8">Loading</text></svg>`
);

/* ===== LAZY OBJECT URL MANAGEMENT ===== */
function ensureReaderPageUrl(idx) {
  if (idx < 0 || idx >= readerPages.length) return null;
  if (!readerPages[idx]) {
    const blob = readerImageBlobs[idx];
    if (!blob) {
      requestReaderPageBlob(idx).catch(e => console.warn("[reader] lazy page request failed", idx, e));
      return null;
    }
    readerPages[idx] = URL.createObjectURL(blob);
  }
  return readerPages[idx];
}

function setReaderImgSrc(img, idx) {
  if (!img) return;
  img.dataset.readerIdx = String(idx);
  const url = ensureReaderPageUrl(idx);
  img.src = url || READER_PLACEHOLDER_SRC;
}

function refreshReaderImages(idx) {
  const url = ensureReaderPageUrl(idx);
  if (!url) return;
  document.querySelectorAll(`img[data-reader-idx="${idx}"]`).forEach(img => {
    if (img.src !== url) img.src = url;
  });
}

function revokeDistantReaderUrls(centerIdx) {
  for (let i = 0; i < readerPages.length; i++) {
    if (readerPages[i] && Math.abs(i - centerIdx) > READER_URL_WINDOW) {
      URL.revokeObjectURL(readerPages[i]);
      readerPages[i] = null;
    }
  }
}

function revokeAllReaderUrls() {
  for (let i = 0; i < readerPages.length; i++) {
    if (readerPages[i]) { URL.revokeObjectURL(readerPages[i]); readerPages[i] = null; }
  }
}

function stopReaderLazyWorker() {
  if (readerLazyWorker) {
    try { readerLazyWorker.terminate(); } catch (_) {}
  }
  readerLazyPending.forEach(({ reject }) => reject(new Error("Reader closed")));
  readerLazyPending.clear();
  readerLazyWorker = null;
  readerLazyMode = false;
  readerLazyPageNames = [];
}

/* ===== DECOMPRESSION UTILS ===== */
function parseTar(arrayBuffer) {
  const uint8 = new Uint8Array(arrayBuffer);
  let offset = 0;
  const files = [];

  while (offset < arrayBuffer.byteLength - 512) {
    let isEmpty = true;
    for (let i = 0; i < 512; i++) {
      if (uint8[offset + i] !== 0) {
        isEmpty = false;
        break;
      }
    }
    if (isEmpty) break;

    let name = "";
    for (let i = 0; i < 100; i++) {
      if (uint8[offset + i] === 0) break;
      name += String.fromCharCode(uint8[offset + i]);
    }

    let sizeStr = "";
    for (let i = 124; i < 136; i++) {
      if (uint8[offset + i] === 0 || uint8[offset + i] === 32) continue;
      sizeStr += String.fromCharCode(uint8[offset + i]);
    }
    const size = parseInt(sizeStr, 8);
    const typeFlag = String.fromCharCode(uint8[offset + 156]);

    offset += 512;

    if (typeFlag === '0' || typeFlag === '\0') {
      // slice() copies into its OWN ArrayBuffer, so file.data.buffer is just
      // this entry's bytes. (subarray would share the whole tar's buffer,
      // making magic-byte detection re-find the parent tar's "ustar" marker
      // and recurse forever — tar would never extract.)
      const fileData = uint8.slice(offset, offset + size);
      files.push({
        name: name.trim(),
        data: fileData,
        size: size
      });
    }

    offset += Math.ceil(size / 512) * 512;
  }
  return files;
}

async function extract7z(arrayBuffer) {
  if (typeof SevenZip === "undefined") {
    throw new Error("SevenZip library is not loaded.");
  }
  const bh = (typeof _EXTRACT_BASE_HREF !== "undefined") ? _EXTRACT_BASE_HREF : "";
  const instance = await SevenZip({
    locateFile: (path) => {
      if (path.endsWith('.wasm')) return bh + 'lib/7zz.wasm';
      return bh + 'lib/' + path;
    }
  });

  instance.FS.writeFile("archive.7z", new Uint8Array(arrayBuffer));
  
  try {
    instance.FS.mkdir("/output");
  } catch (e) {}

  try {
    instance.callMain(["x", "archive.7z", "-o/output", "-y"]);
  } catch (e) {
    if (e.name !== "ExitStatus" || e.status !== 0) {
      console.error("7z command error:", e);
    }
  }

  const files = [];
  function walk(dir) {
    const list = instance.FS.readdir(dir);
    for (const name of list) {
      if (name === "." || name === "..") continue;
      const fullPath = dir + (dir.endsWith("/") ? "" : "/") + name;
      const stat = instance.FS.stat(fullPath);
      const isDir = (stat.mode & 61440) === 16384;
      if (isDir) {
        walk(fullPath);
      } else {
        const data = instance.FS.readFile(fullPath);
        files.push({
          name: name,
          path: fullPath,
          data: data,
          size: data.byteLength
        });
      }
    }
  }
  walk("/output");
  return files;
}

function isArchive(name) {
  const ext = name.split(".").pop().toLowerCase();
  return ["zip", "cbz", "7z", "tar", "gz", "tgz"].includes(ext);
}

function detectMagicType(arrayBuffer) {
  const uint8 = new Uint8Array(arrayBuffer);
  if (uint8.length >= 4 && uint8[0] === 0x50 && uint8[1] === 0x4B && uint8[2] === 0x03 && uint8[3] === 0x04) {
    return "zip";
  }
  if (uint8.length >= 6 && uint8[0] === 0x37 && uint8[1] === 0x7A && uint8[2] === 0xBC && uint8[3] === 0xAF && uint8[4] === 0x27 && uint8[5] === 0x1C) {
    return "7z";
  }
  if (uint8.length >= 2 && uint8[0] === 0x1F && uint8[1] === 0x8B) {
    return "gzip";
  }
  if (uint8.length >= 262) {
    const ustar = String.fromCharCode(...uint8.slice(257, 262));
    if (ustar === "ustar") {
      return "tar";
    }
  }
  return null;
}

function isArchiveData(name, arrayBuffer) {
  if (detectMagicType(arrayBuffer)) return true;
  return isArchive(name);
}

// Detect an image by magic bytes (so files without a usable extension,
// e.g. "u=123456" downloaded image names, are still recognized).
function isImageData(data) {
  const u = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (u.length < 4) return false;
  if (u[0] === 0x89 && u[1] === 0x50 && u[2] === 0x4E && u[3] === 0x47) return true;          // PNG
  if (u[0] === 0xFF && u[1] === 0xD8 && u[2] === 0xFF) return true;                            // JPEG
  if (u[0] === 0x47 && u[1] === 0x49 && u[2] === 0x46 && u[3] === 0x38) return true;          // GIF
  if (u.length >= 12 && u[0] === 0x52 && u[1] === 0x49 && u[2] === 0x46 && u[3] === 0x46
      && u[8] === 0x57 && u[9] === 0x45 && u[10] === 0x42 && u[11] === 0x50) return true;      // WEBP
  if (u[0] === 0x42 && u[1] === 0x4D) return true;                                             // BMP
  return false;
}

function isImageEntry(name, data) {
  const ext = (name || "").split(".").pop().toLowerCase();
  if (["png","jpg","jpeg","gif","webp","svg","bmp"].includes(ext)) return true;
  return isImageData(data);
}

// Return an ArrayBuffer holding exactly this view's bytes (a typed-array
// view may share a larger buffer; never pass the shared buffer to detection
// or it reads the wrong offset).
function exactBuffer(u) {
  if (!(u instanceof Uint8Array)) return u;
  return (u.byteOffset === 0 && u.byteLength === u.buffer.byteLength)
    ? u.buffer
    : u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength);
}

async function extractAllImagesRecursive(name, arrayBuffer) {
  let images = [];
  const uint8 = new Uint8Array(arrayBuffer);
  
  let format = detectMagicType(arrayBuffer);
  if (!format) {
    const ext = name.split(".").pop().toLowerCase();
    if (ext === "zip" || ext === "cbz") format = "zip";
    else if (ext === "7z") format = "7z";
    else if (ext === "tar") format = "tar";
    else if (ext === "gz" || ext === "tgz") format = "gzip";
  }

  if (format === "zip") {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const entries = [];
    zip.forEach((relPath, entry) => {
      if (entry.dir || relPath.startsWith("__MACOSX") || relPath.startsWith(".")) return;
      entries.push(entry);
    });

    for (const entry of entries) {
      const entryBuf = await entry.async("arraybuffer");
      if (isArchiveData(entry.name, entryBuf)) {
        const sub = await extractAllImagesRecursive(entry.name, entryBuf);
        images.push(...sub);
      } else if (isImageEntry(entry.name, new Uint8Array(entryBuf))) {
        images.push({ name: entry.name, data: new Blob([entryBuf]) });
      }
    }
  } else if (format === "tar" || format === "gzip") {
    let uint8Data = uint8;
    if (format === "gzip") {
      try {
        uint8Data = pako.ungzip(uint8);
      } catch (e) {
        console.error("pako ungzip failed", e);
      }
    }
    const innerType = detectMagicType(exactBuffer(uint8Data));
    if (innerType === "tar" || name.toLowerCase().endsWith(".tar") || name.toLowerCase().endsWith(".tgz")) {
      const tarFiles = parseTar(exactBuffer(uint8Data));
      for (const file of tarFiles) {
        const eb = exactBuffer(file.data);
        if (isArchiveData(file.name, eb)) {
          const sub = await extractAllImagesRecursive(file.name, eb);
          images.push(...sub);
        } else if (isImageEntry(file.name, file.data)) {
          images.push({ name: file.name, data: new Blob([file.data]) });
        }
      }
    } else {
      const cleanName = name.replace(/\.gz$/i, "");
      if (isImageEntry(cleanName, uint8Data)) {
        images.push({ name: cleanName, data: new Blob([uint8Data]) });
      }
    }
  } else if (format === "7z") {
    const files = await extract7z(arrayBuffer);
    for (const file of files) {
      const eb = exactBuffer(file.data);
      if (isArchiveData(file.name, eb)) {
        const sub = await extractAllImagesRecursive(file.name, eb);
        images.push(...sub);
      } else if (isImageEntry(file.name, file.data)) {
        images.push({ name: file.name, data: new Blob([file.data]) });
      }
    }
  }

  return images;
}

async function extractFirstImageRecursive(name, arrayBuffer) {
  const uint8 = new Uint8Array(arrayBuffer);
  let format = detectMagicType(arrayBuffer);
  if (!format) {
    const ext = name.split(".").pop().toLowerCase();
    if (ext === "zip" || ext === "cbz") format = "zip";
    else if (ext === "7z") format = "7z";
    else if (ext === "tar") format = "tar";
    else if (ext === "gz" || ext === "tgz") format = "gzip";
  }

  if (format === "zip") {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const entries = [];
    zip.forEach((relPath, entry) => {
      if (entry.dir || relPath.startsWith("__MACOSX") || relPath.startsWith(".")) return;
      entries.push(entry);
    });
    entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

    for (const entry of entries) {
      const entryBuf = await entry.async("arraybuffer");
      if (isArchiveData(entry.name, entryBuf)) {
        const sub = await extractFirstImageRecursive(entry.name, entryBuf);
        if (sub) return sub;
      } else if (isImageEntry(entry.name, new Uint8Array(entryBuf))) {
        return { name: entry.name, data: new Blob([entryBuf]) };
      }
    }
  } else if (format === "tar" || format === "gzip") {
    let uint8Data = uint8;
    if (format === "gzip") {
      try {
        uint8Data = pako.ungzip(uint8);
      } catch (e) {
        console.error("pako ungzip failed", e);
      }
    }

    const innerType = detectMagicType(exactBuffer(uint8Data));
    if (innerType === "tar" || name.toLowerCase().endsWith(".tar") || name.toLowerCase().endsWith(".tgz")) {
      const tarFiles = parseTar(exactBuffer(uint8Data))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
      for (const file of tarFiles) {
        const eb = exactBuffer(file.data);
        if (isArchiveData(file.name, eb)) {
          const sub = await extractFirstImageRecursive(file.name, eb);
          if (sub) return sub;
        } else if (isImageEntry(file.name, file.data)) {
          return { name: file.name, data: new Blob([file.data]) };
        }
      }
    } else {
      const cleanName = name.replace(/\.gz$/i, "");
      if (isImageEntry(cleanName, uint8Data)) {
        return { name: cleanName, data: new Blob([uint8Data]) };
      }
    }
  } else if (format === "7z") {
    const files = (await extract7z(arrayBuffer))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
    for (const file of files) {
      const eb = exactBuffer(file.data);
      if (isArchiveData(file.name, eb)) {
        const sub = await extractFirstImageRecursive(file.name, eb);
        if (sub) return sub;
      } else if (isImageEntry(file.name, file.data)) {
        return { name: file.name, data: new Blob([file.data]) };
      }
    }
  }

  return null;
}

async function extractFirstComicImageBlob(name, blob) {
  const first = await extractFirstImageRecursive(name, await blob.arrayBuffer());
  return first?.data || null;
}

function stopReaderExtractWorker() {
  if (readerExtractWorker) {
    try { readerExtractWorker.terminate(); } catch (_) {}
    readerExtractWorker = null;
  }
}

async function isZipBlob(blob) {
  const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  return head[0] === 0x50 && head[1] === 0x4B;
}

function extractImagesInWorker(blob, name) {
  stopReaderExtractWorker();
  const baseHref = location.href.replace(/[^/]*$/, "");
  const jszipUrl = new URL("lib/jszip.min.js", location.href).href;
  const pakoUrl = new URL("lib/pako.min.js", location.href).href;
  const sevenZipUrl = new URL("lib/7zz.umd.js", location.href).href;

  const workerCode = [
    "var _EXTRACT_BASE_HREF = '';",
    parseTar.toString(),
    extract7z.toString(),
    isArchive.toString(),
    detectMagicType.toString(),
    isArchiveData.toString(),
    isImageData.toString(),
    isImageEntry.toString(),
    exactBuffer.toString(),
    extractAllImagesRecursive.toString(),
    `
    self.onmessage = async (event) => {
      const { blob, name, jszipUrl, pakoUrl, sevenZipUrl, baseHref } = event.data;
      _EXTRACT_BASE_HREF = baseHref;
      try {
        importScripts(jszipUrl);
        importScripts(pakoUrl);
        try { importScripts(sevenZipUrl); } catch (e) {}
        const arrayBuffer = await blob.arrayBuffer();
        const images = await extractAllImagesRecursive(name, arrayBuffer);
        images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
        const BATCH = 12;
        for (let i = 0; i < images.length; i += BATCH) {
          const batch = images.slice(i, i + BATCH);
          const done = i + BATCH >= images.length;
          self.postMessage({ ok: true, batch, offset: i, total: images.length, done });
          if (!done) await new Promise(r => setTimeout(r, 0));
        }
      } catch (error) {
        self.postMessage({ ok: false, error: error?.message || String(error) });
      }
    };`
  ].join("\n\n");

  const workerUrl = URL.createObjectURL(new Blob([workerCode], { type: "application/javascript" }));
  const worker = new Worker(workerUrl);
  URL.revokeObjectURL(workerUrl);
  readerExtractWorker = worker;

  return new Promise((resolve, reject) => {
    const allImages = [];
    const cleanup = () => {
      worker.onmessage = null;
      worker.onerror = null;
      if (readerExtractWorker === worker) readerExtractWorker = null;
      worker.terminate();
    };
    worker.onmessage = (event) => {
      const data = event.data;
      if (!data?.ok) {
        cleanup();
        reject(new Error(data?.error || "Extraction failed"));
        return;
      }
      allImages.push(...data.batch);
      if (data.done) {
        cleanup();
        resolve(allImages);
      }
    };
    worker.onerror = (event) => {
      cleanup();
      reject(new Error(event.message || "Worker failed"));
    };
    worker.postMessage({ blob, name, jszipUrl, pakoUrl, sevenZipUrl, baseHref });
  });
}

function isZipLikeReaderFile(name, blob) {
  const ext = (name || "").split(".").pop().toLowerCase();
  return ["zip", "cbz"].includes(ext) || blob?.type === "application/zip";
}

async function isZipLikeReaderBlob(name, blob) {
  if (!blob) return false;
  if (isZipLikeReaderFile(name, blob)) return true;
  try {
    const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    return head[0] === 0x50 && head[1] === 0x4B && (head[2] === 0x03 || head[2] === 0x05 || head[2] === 0x07);
  } catch (e) {
    console.warn("[reader] zip header probe failed:", e);
    return false;
  }
}

async function shouldUseLazyZipReader(name, blob) {
  return await isZipLikeReaderBlob(name, blob)
    && (blob.size >= READER_LAZY_ZIP_BYTES || /iphone|ipad|ipod|android/i.test(navigator.userAgent || ""));
}

function shouldForceReaderLazyMode(blob) {
  return !!blob && blob.size >= READER_LARGE_ARCHIVE_BYTES;
}

function createLazyZipReader(blob, name, initArrayBuffer = null) {
  stopReaderLazyWorker();
  const jszipUrl = new URL("lib/jszip.min.js", location.href).href;
  const workerCode = `
    let zip = null;
    let entries = [];
    function isImageEntryName(name) {
      return /\\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || "");
    }
    function isNoisePath(name) {
      return !name || name.startsWith("__MACOSX") || name.startsWith(".") || /(^|\\/)\\./.test(name);
    }
    self.onmessage = async (event) => {
      const data = event.data || {};
      try {
        if (data.type === "init") {
          importScripts(data.jszipUrl);
          const arrayBuffer = data.arrayBuffer || await data.blob.arrayBuffer();
          zip = await JSZip.loadAsync(arrayBuffer);
          entries = [];
          zip.forEach((relPath, entry) => {
            if (entry.dir || isNoisePath(relPath) || !isImageEntryName(relPath)) return;
            entries.push(entry);
          });
          entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
          self.postMessage({ type: "ready", names: entries.map(e => e.name), total: entries.length });
          return;
        }
        if (data.type === "page") {
          const idx = data.idx;
          const entry = entries[idx];
          if (!entry) throw new Error("Page not found");
          const arrayBuffer = await entry.async("arraybuffer");
          self.postMessage({ type: "page", idx, blob: new Blob([arrayBuffer]) });
        }
      } catch (error) {
        self.postMessage({ type: "error", idx: data.idx, error: error?.message || String(error) });
      }
    };
  `;
  const workerUrl = URL.createObjectURL(new Blob([workerCode], { type: "application/javascript" }));
  const worker = new Worker(workerUrl);
  URL.revokeObjectURL(workerUrl);
  readerLazyWorker = worker;

  return new Promise((resolve, reject) => {
    const cleanupInit = () => {
      worker.removeEventListener("message", onInitMessage);
      worker.removeEventListener("error", onInitError);
    };
    const onInitError = (event) => {
      cleanupInit();
      stopReaderLazyWorker();
      reject(new Error(event.message || "Lazy reader failed"));
    };
    const onInitMessage = (event) => {
      const data = event.data || {};
      if (data.type === "ready") {
        cleanupInit();
        readerLazyPageNames = data.names || [];
        readerLazyMode = true;
        resolve({ lazy: true, names: readerLazyPageNames, total: data.total || 0, size: blob.size, name });
      } else if (data.type === "error") {
        cleanupInit();
        stopReaderLazyWorker();
        reject(new Error(data.error || "Lazy reader failed"));
      }
    };
    worker.addEventListener("message", onInitMessage);
    worker.addEventListener("error", onInitError);
    worker.addEventListener("message", handleLazyReaderMessage);
    const payload = { type: "init", blob: initArrayBuffer ? null : blob, arrayBuffer: initArrayBuffer, name, jszipUrl };
    if (initArrayBuffer) worker.postMessage(payload, [initArrayBuffer]);
    else worker.postMessage(payload);
  });
}

function handleLazyReaderMessage(event) {
  const data = event.data || {};
  if (data.type === "page") {
    const pending = readerLazyPending.get(data.idx);
    readerLazyPending.delete(data.idx);
    if (readerPages[data.idx]) {
      URL.revokeObjectURL(readerPages[data.idx]);
      readerPages[data.idx] = null;
    }
    readerImageBlobs[data.idx] = data.blob;
    refreshReaderImages(data.idx);
    pending?.resolve(data.blob);
  } else if (data.type === "error") {
    const pending = readerLazyPending.get(data.idx);
    if (pending) {
      readerLazyPending.delete(data.idx);
      pending.reject(new Error(data.error || "Page load failed"));
    }
  }
}

function requestReaderPageBlob(idx) {
  if (!readerLazyMode || !readerLazyWorker || idx < 0 || idx >= readerImageBlobs.length) {
    return Promise.resolve(readerImageBlobs[idx] || null);
  }
  if (readerImageBlobs[idx]) return Promise.resolve(readerImageBlobs[idx]);
  if (readerLazyPending.has(idx)) return readerLazyPending.get(idx).promise;
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  readerLazyPending.set(idx, { promise, resolve, reject });
  readerLazyWorker.postMessage({ type: "page", idx });
  return promise;
}

async function extractImagesForReader(name, blob) {
  if (shouldForceReaderLazyMode(blob)) {
    try {
      return await createLazyZipReader(blob, name);
    } catch (e) {
      console.warn("[reader] forced lazy mode failed, continuing with fallback:", e);
    }
  }
  if (await shouldUseLazyZipReader(name, blob)) {
    try {
      return await createLazyZipReader(blob, name);
    } catch (e) {
      const msg = String(e?.message || e || "");
      if (!/I\/O|read|operation/i.test(msg)) throw e;
      console.warn("[reader] lazy Blob read failed, retrying with ArrayBuffer:", e);
      const buf = await blob.arrayBuffer();
      return await createLazyZipReader(new Blob([buf]), name, buf);
    }
  }
  try {
    return { lazy: false, images: await extractImagesInWorker(blob, name), size: blob.size };
  } catch (e) {
    console.warn("[reader] worker extraction failed, falling back to main thread:", e);
    return { lazy: false, images: await extractAllImagesRecursive(name, await blob.arrayBuffer()), size: blob.size };
  }
}

/* ===== OPEN READER ===== */
async function openComicReader(zipBlob, name, onFirstImageLoaded) {
  const openSeq = ++readerOpenSeq;
  const overlay = document.getElementById("readerOverlay");
  const canvas = document.getElementById("readerCanvas");
  overlay.classList.add("active");
  readerName = name;
  rPageIdx = 0;
  stopReaderExtractWorker();
  stopReaderLazyWorker();
  destroyPageFlip();
  revokeAllReaderUrls();
  readerPages = [];
  readerImageBlobs = [];
  readerLargeModeLocked = false;
  initReaderGestures();
  document.getElementById("readerFileName").textContent = name;
  document.getElementById("readerPageIndicator").textContent = "...";
  document.getElementById("readerTop")?.classList.add("hidden");
  document.getElementById("readerControls")?.classList.remove("visible");

  canvas.innerHTML = `<div class="empty-placeholder" style="border:none"><svg class="spinner" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg><p>${t("parsingZip")}</p></div>`;

  try {
    const result = await extractImagesForReader(name, zipBlob);
    if (openSeq !== readerOpenSeq) return;

    const total = result.lazy ? result.total : result.images.length;
    if (total === 0) {
      canvas.innerHTML = `<div class="empty-placeholder" style="border:none"><p>${t("parseErr")}</p></div>`;
      return;
    }

    if (result.lazy) {
      readerImageBlobs = new Array(total).fill(null);
      readerPages = new Array(total).fill(null);
      readerLargeModeLocked = true;
      if (readerLargeModeLocked && rMode !== "click") rMode = "click";

      const firstBlob = await requestReaderPageBlob(0).catch(() => null);
      if (openSeq !== readerOpenSeq) return;
      if (typeof onFirstImageLoaded === "function" && firstBlob) {
        Promise.resolve(onFirstImageLoaded(firstBlob)).catch(e => console.warn("[comic-cover] first page callback failed", e));
      }
    } else {
      const images = result.images;
      // Natural Alphanumeric Sort
      images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

      if (typeof onFirstImageLoaded === "function") {
        Promise.resolve(onFirstImageLoaded(images[0].data)).catch(e => console.warn("[comic-cover] first page callback failed", e));
      }

      readerImageBlobs = images.map(img => img.data);
      readerPages = new Array(images.length).fill(null);
      const totalBytes = readerImageBlobs.reduce((sum, blob) => sum + (blob?.size || 0), 0);
      readerLargeModeLocked = images.length > READER_HEAVY_MODE_PAGE_LIMIT || (result.size || 0) > READER_HEAVY_MODE_BYTES || totalBytes > READER_HEAVY_MODE_BYTES;
      if (readerLargeModeLocked && rMode !== "click") rMode = "click";
    }
    if (openSeq !== readerOpenSeq) {
      revokeAllReaderUrls();
      readerPages = [];
      readerImageBlobs = [];
      return;
    }

    initReaderUI();
    renderPage();
    toast(`${readerPages.length} ${t("parseOk")}${result.lazy ? " · 按需加载" : ""}${readerLargeModeLocked ? " · 省内存模式" : ""}`, "success");
  } catch (e) {
    console.error(e);
    if (openSeq === readerOpenSeq) {
      canvas.innerHTML = `<div class="empty-placeholder" style="border:none"><p>${t("parseErr")}</p></div>`;
    }
  }
}

/* ===== CLOSE READER ===== */
function closeReader() {
  readerOpenSeq++;
  stopAuto();
  stopReaderLazyWorker();
  destroyPageFlip();
  cancelAnimationFrame(pfRAF);
  revokeAllReaderUrls();
  readerPages = [];
  readerImageBlobs = [];
  clearPageFlipRenderUrls();
  document.getElementById("readerOverlay").classList.remove("active");
  document.getElementById("readerCanvas").innerHTML = "";
  document.getElementById("readerProgressBadge").textContent = "";
  document.getElementById("readerTop")?.classList.remove("hidden");
  document.getElementById("readerControls").classList.remove("visible");
  closeSidebar();
}

/* ===== READER UI INIT ===== */
function initReaderUI() {
  const modeSel = document.getElementById("rModeSelect");
  const speedSlider = document.getElementById("rSpeedSlider");

  modeSel.value = rMode;
  Array.from(modeSel.options).forEach(opt => {
    opt.disabled = readerLargeModeLocked && opt.value !== "click";
  });
  speedSlider.value = rAutoSpeed;
  document.getElementById("rSpeedVal").textContent = rAutoSpeed;

  modeSel.onchange = () => {
    if (readerLargeModeLocked && modeSel.value !== "click") {
      modeSel.value = "click";
      rMode = "click";
      toast("大文件已启用省内存阅读模式", "info");
      return;
    }
    rMode = modeSel.value;
    stopAuto();
    renderPage();
  };
  speedSlider.oninput = () => { rAutoSpeed = parseInt(speedSlider.value); document.getElementById("rSpeedVal").textContent = rAutoSpeed; if (rAutoPlaying) { stopAuto(); startAuto(); } };

  // Build the page-fan progress selector
  buildPageFan();

  updateProgress();
}

function updateProgress() {
  const progressText = `${String(rPageIdx+1).padStart(2,"0")}/${readerPages.length}`;
  document.getElementById("readerPageIndicator").textContent = progressText;
  document.getElementById("readerProgressBadge").textContent = progressText;

  // Keep the page fan in sync (unless the user is actively dragging it)
  if (!pfDragging) { pfPos = rPageIdx; layoutPageFan(); }

  // Preload adjacent pages
  preloadAdjacent();
  revokeDistantReaderUrls(rPageIdx);
}

function preloadAdjacent() {
  const totalBytes = readerImageBlobs.reduce((sum, blob) => sum + (blob?.size || 0), 0);
  const range = totalBytes > READER_PAGE_PREFETCH_BYTES ? 1 : 2;
  for (let i = 1; i <= range; i++) {
    const next = rPageIdx + i;
    if (next < readerPages.length) {
      ensureReaderPageUrl(next);
    }
  }
  const prev = rPageIdx - 1;
  if (prev >= 0) {
    ensureReaderPageUrl(prev);
  }
}

function clearPageFlipRenderUrls() {
  pageFlipRenderUrls.forEach((url) => URL.revokeObjectURL(url));
  pageFlipRenderUrls = [];
}

function loadReaderImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function getPageFlipBookSize(stage) {
  const host = stage.parentElement || stage;
  const rect = host.getBoundingClientRect();
  return {
    width: Math.max(1, Math.round(rect.width || window.innerWidth || 360)),
    height: Math.max(1, Math.round(rect.height || window.innerHeight || 560))
  };
}

async function preparePageFlipImages(width, height, initSeq) {
  clearPageFlipRenderUrls();
  for (let i = 0; i < readerPages.length; i++) {
    ensureReaderPageUrl(i);
  }
  return readerPages;
}

/* ===== RENDER PAGE ===== */
function renderPage() {
  const container = document.getElementById("readerCanvas");
  destroyPageFlip();
  container.innerHTML = "";

  if (rMode === "click") {
    readerImageZoomed = false;
    const wrap = document.createElement("div"); wrap.className = "reader-page-wrap";
    const box = document.createElement("div"); box.className = "r-page-img-box r-swipe-box";
    const img = document.createElement("img");
    img.className = "r-click-page current";
    setReaderImgSrc(img, rPageIdx);
    img.alt = `Page ${rPageIdx+1}`;

    const tapL = document.createElement("div"); tapL.className = "r-tap-zone r-tap-left";
    tapL.onclick = e => { e.stopPropagation(); if (!readerImageZoomed && !ignoreClickSwipeTap()) flipPage(-1); };
    const tapR = document.createElement("div"); tapR.className = "r-tap-zone r-tap-right";
    tapR.onclick = e => { e.stopPropagation(); if (!readerImageZoomed && !ignoreClickSwipeTap()) flipPage(1); };

    box.onclick = () => { if (!readerImageZoomed && !ignoreClickSwipeTap()) toggleControls(); };
    box.appendChild(img); box.appendChild(tapL); box.appendChild(tapR);
    wrap.appendChild(box); container.appendChild(wrap);

    if (typeof enableImageZoom === "function") {
      enableImageZoom(img, box, (z) => { readerImageZoomed = z; }, { doubleTap: false });
    }
  } else if (rMode === "slide") {
    const wrap = document.createElement("div"); wrap.className = "r-h-scroll"; wrap.id = "hScroll";
    readerPages.forEach((_, i) => {
      const pg = document.createElement("div"); pg.className = "r-h-page";
      const img = document.createElement("img"); img.loading = "lazy";
      setReaderImgSrc(img, i);
      pg.appendChild(img); pg.onclick = () => toggleControls(); wrap.appendChild(pg);
    });
    container.appendChild(wrap);
    wrap.addEventListener("scroll", () => {
      const idx = Math.round(wrap.scrollLeft / wrap.clientWidth);
      if (idx !== rPageIdx && idx >= 0 && idx < readerPages.length) { rPageIdx = idx; updateProgress(); }
    });
    setTimeout(() => { wrap.scrollLeft = rPageIdx * wrap.clientWidth; }, 50);
  } else if (rMode === "webtoon") {
    const wrap = document.createElement("div"); wrap.className = "r-v-scroll"; wrap.id = "vScroll";
    readerPages.forEach((_, i) => {
      const pg = document.createElement("div"); pg.className = "r-v-page"; pg.id = `vp-${i}`;
      const img = document.createElement("img"); img.loading = "lazy";
      setReaderImgSrc(img, i);
      pg.appendChild(img); pg.onclick = () => toggleControls(); wrap.appendChild(pg);
    });
    container.appendChild(wrap);
    wrap.addEventListener("scroll", () => {
      let best = 0, minD = Infinity;
      const cy = wrap.scrollTop + wrap.clientHeight / 2;
      readerPages.forEach((_, i) => {
        const el = document.getElementById(`vp-${i}`);
        if (el) { const d = Math.abs(el.offsetTop + el.offsetHeight / 2 - cy); if (d < minD) { minD = d; best = i; } }
      });
      if (best !== rPageIdx) { rPageIdx = best; updateProgress(); }
    });
    setTimeout(() => { const el = document.getElementById(`vp-${rPageIdx}`); if (el) wrap.scrollTop = el.offsetTop; }, 50);
  } else if (rMode === "flip") {
    readerImageZoomed = false;
    const stage = document.createElement("div"); stage.className = "pageflip-stage"; stage.id = "flipStage";
    const hitLayer = document.createElement("div"); hitLayer.className = "pageflip-hit-layer";
    stage.appendChild(hitLayer);
    // Show current page as a placeholder while the library loads
    const placeholder = document.createElement("img");
    placeholder.className = "pageflip-placeholder";
    setReaderImgSrc(placeholder, rPageIdx);
    placeholder.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:1;";
    stage.appendChild(placeholder);
    container.appendChild(stage);
    setTimeout(() => initPageFlip(stage, placeholder), 30);
  }
}

/* ===== PAGE-FLIP LIBRARY MODE ===== */
async function initPageFlip(stage, placeholder) {
  const initSeq = ++pageFlipInitSeq;
  if (rMode !== "flip" || !stage) return;
  if (!window.St?.PageFlip) {
    toast("翻页引擎加载失败", "error");
    return;
  }

  const { width, height } = getPageFlipBookSize(stage);
  stage.style.setProperty("--pageflip-book-width", `${width}px`);
  stage.style.setProperty("--pageflip-book-height", `${height}px`);
  const flipImages = await preparePageFlipImages(width, height, initSeq);
  if (!flipImages || initSeq !== pageFlipInitSeq || rMode !== "flip" || !stage.isConnected) return;

  pageFlipBook = new St.PageFlip(stage, {
    width,
    height,
    size: "stretch",
    minWidth: width,
    maxWidth: width,
    minHeight: height,
    maxHeight: height,
    startPage: rPageIdx,
    showCover: false,
    usePortrait: true,
    autoSize: false,
    drawShadow: true,
    maxShadowOpacity: 0.42,
    flippingTime: 620,
    mobileScrollSupport: false,
    swipeDistance: 12,
    showPageCorners: false,
    disableFlipByClick: false,
    useMouseEvents: false
  });

  pageFlipBook.on("flip", (e) => {
    const idx = Number(e.data);
    if (Number.isFinite(idx) && idx !== rPageIdx) {
      rPageIdx = Math.max(0, Math.min(readerPages.length - 1, idx));
      updateProgress();
    }
  });

  pageFlipBook.loadFromImages(flipImages);
  // Remove placeholder once the library is rendered
  if (placeholder && placeholder.parentNode) placeholder.remove();
  attachPageFlipTapZones(stage);
}

function destroyLibraryPageFlip() {
  pageFlipInitSeq++;
  clearPageFlipRenderUrls();
  if (!pageFlipBook) return;
  try { pageFlipBook.destroy(); } catch (_) {}
  pageFlipBook = null;
}

function attachPageFlipTapZones(stage) {
  let sx = 0, sy = 0, st = 0, pointerActive = false, dragging = false, lastTouchTap = 0;
  let lastMoveX = 0, lastMoveT = 0, swipeVelocity = 0;
  const inputLayer = stage.querySelector(".pageflip-hit-layer") || stage;

  const getBookRect = () => {
    const el = stage.querySelector(".stf__block, .stf__canvas") || stage;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? r : stage.getBoundingClientRect();
  };

  const getBookPoint = (clientX, clientY) => {
    const r = getBookRect();
    return {
      x: Math.max(0, Math.min(r.width, clientX - r.left)),
      y: Math.max(0, Math.min(r.height, clientY - r.top))
    };
  };

  const handleTap = (clientX, clientY, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const r = getBookRect();
    const x = clientX - r.left;
    const y = Math.max(0, Math.min(r.height, clientY - r.top));
    const corner = y < r.height / 2 ? "top" : "bottom";
    if (clientX < r.left || x < r.width * 0.35) flipPage(-1, corner);
    else if (clientX > r.right || x > r.width * 0.65) flipPage(1, corner);
    else toggleControls();
  };

  const maybeStartDrag = (clientX, clientY, e) => {
    if (!pointerActive || dragging || !pageFlipBook) return false;
    const dx = clientX - sx;
    const dy = clientY - sy;
    if (Math.hypot(dx, dy) < 5 || Math.abs(dx) < 4) return false;
    dragging = true;
    lastMoveX = clientX;
    lastMoveT = Date.now();
    swipeVelocity = 0;
    pageFlipBook.startUserTouch(getBookPoint(sx, sy));
    pageFlipBook.userMove(getBookPoint(clientX, clientY), true);
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    return true;
  };

  const moveDrag = (clientX, clientY, e) => {
    if (!dragging || !pageFlipBook) return;
    // Track velocity for flick detection
    const now = Date.now();
    const dt = now - lastMoveT;
    if (dt > 0) {
      swipeVelocity = (clientX - lastMoveX) / dt; // px/ms
    }
    lastMoveX = clientX;
    lastMoveT = now;
    pageFlipBook.userMove(getBookPoint(clientX, clientY), true);
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const finishDrag = (clientX, clientY, e) => {
    if (!dragging || !pageFlipBook) return false;
    const dx = clientX - sx;
    const dt = Date.now() - st;
    const absDx = Math.abs(dx);
    // Detect flick: quick swipe with enough distance OR velocity
    const isFlick = (absDx > 15 && dt < 500) || Math.abs(swipeVelocity) > 0.3;
    const r = getBookRect();
    const corner = (sy - r.top) < r.height / 2 ? "top" : "bottom";

    if (isFlick && absDx > 10) {
      const ctrl = pageFlipBook.getFlipController();
      if (ctrl) ctrl.forceFlip = true;
    }

    pageFlipBook.userStop(getBookPoint(clientX, clientY), false);
    dragging = false;
    pointerActive = false;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    return true;
  };

  inputLayer.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    st = Date.now();
    pointerActive = true;
    dragging = false;
    swipeVelocity = 0;
  }, { passive: true });

  inputLayer.addEventListener("touchmove", (e) => {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    if (!maybeStartDrag(t0.clientX, t0.clientY, e)) {
      moveDrag(t0.clientX, t0.clientY, e);
    }
  }, { passive: false });

  inputLayer.addEventListener("touchend", (e) => {
    if (!e.changedTouches.length) return;
    const t0 = e.changedTouches[0];
    if (finishDrag(t0.clientX, t0.clientY, e)) return;
    pointerActive = false;
    const dx = Math.abs(t0.clientX - sx);
    const dy = Math.abs(t0.clientY - sy);
    if (Date.now() - st < 360 && dx < 12 && dy < 12) {
      lastTouchTap = Date.now();
      handleTap(t0.clientX, t0.clientY, e);
    }
  }, { passive: false });

  inputLayer.addEventListener("mousedown", (e) => {
    if (Date.now() - lastTouchTap < 600) return;
    pointerActive = true;
    dragging = false;
    sx = e.clientX;
    sy = e.clientY;
    st = Date.now();
    swipeVelocity = 0;
  });

  inputLayer.addEventListener("mousemove", (e) => {
    if (!maybeStartDrag(e.clientX, e.clientY, e)) {
      moveDrag(e.clientX, e.clientY, e);
    }
  });

  inputLayer.addEventListener("mouseup", (e) => {
    if (!pointerActive || Date.now() - lastTouchTap < 600) return;
    if (finishDrag(e.clientX, e.clientY, e)) return;
    pointerActive = false;
    const dx = Math.abs(e.clientX - sx);
    const dy = Math.abs(e.clientY - sy);
    if (Date.now() - st < 360 && dx < 8 && dy < 8) handleTap(e.clientX, e.clientY, e);
  });

  inputLayer.addEventListener("mouseleave", (e) => {
    if (dragging) finishDrag(e.clientX, e.clientY, e);
    pointerActive = false;
  });
}

/* ===== SELF-BUILT SINGLE-PAGE FLIP ===== */
/* ===== SELF-BUILT CANVAS PAGE-CURL ===== */
let curlCanvas = null, curlCtx = null;
let curlCW = 0, curlCH = 0, curlDpr = 1;
let curlOffA = null, curlOffB = null;   // offscreen page frames
const curlImgCache = new Map();         // idx -> HTMLImageElement
let curlBusy = false;
let curlRAF = null;
let curlResizeBound = false;

function clampRange(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(edge0, edge1, x) {
  const t = clampRange((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function getCurlImg(idx) {
  if (idx < 0 || idx >= readerPages.length) return null;
  let im = curlImgCache.get(idx);
  if (!im) { const url = ensureReaderPageUrl(idx); if (!url) return null; im = new Image(); im.src = url; curlImgCache.set(idx, im); }
  return im;
}

function initCurl(stage, canvas) {
  if (rMode !== "flip") return;
  curlCanvas = canvas;
  curlCtx = canvas.getContext("2d");
  resizeCurl();
  getCurlImg(rPageIdx - 1); getCurlImg(rPageIdx); getCurlImg(rPageIdx + 1);
  drawCurlStatic();
  attachCurlGestures(canvas);
  if (!curlResizeBound) {
    curlResizeBound = true;
    window.addEventListener("resize", () => {
      if (rMode === "flip" && curlCanvas) { resizeCurl(); if (!curlBusy) drawCurlStatic(); }
    });
  }
}

function resizeCurl() {
  if (!curlCanvas) return;
  curlDpr = Math.min(1.85, window.devicePixelRatio || 1);
  const r = curlCanvas.getBoundingClientRect();
  curlCW = Math.max(1, Math.round(r.width * curlDpr));
  curlCH = Math.max(1, Math.round(r.height * curlDpr));
  curlCanvas.width = curlCW; curlCanvas.height = curlCH;
  if (curlCtx) curlCtx.imageSmoothingEnabled = true;
  if (!curlOffA) { curlOffA = document.createElement("canvas"); curlOffB = document.createElement("canvas"); }
  curlOffA.width = curlCW; curlOffA.height = curlCH;
  curlOffB.width = curlCW; curlOffB.height = curlCH;
}

// Draw page `idx` into an offscreen canvas, contain-fitted on white.
function renderPageToOff(off, idx, cb) {
  const octx = off.getContext("2d");
  const paint = () => {
    octx.fillStyle = "#fff";
    octx.fillRect(0, 0, curlCW, curlCH);
    const im = getCurlImg(idx);
    if (im && im.complete && im.naturalWidth) {
      const iw = im.naturalWidth, ih = im.naturalHeight;
      const scale = Math.min(curlCW / iw, curlCH / ih);
      const w = iw * scale, h = ih * scale;
      octx.drawImage(im, (curlCW - w) / 2, (curlCH - h) / 2, w, h);
    }
    if (cb) cb();
  };
  const im = getCurlImg(idx);
  if (im && !(im.complete && im.naturalWidth)) { im.onload = paint; }
  paint();
}

function drawCurlStatic() {
  if (!curlCtx) return;
  renderPageToOff(curlOffA, rPageIdx, () => {
    curlCtx.clearRect(0, 0, curlCW, curlCH);
    curlCtx.drawImage(curlOffA, 0, 0);
  });
}

function creasePathMapped(ctx, topFold, midFold, bottomFold, curve, mapX) {
  ctx.moveTo(mapX(topFold), 0);
  ctx.bezierCurveTo(
    mapX(midFold + curve * 0.25), curlCH * 0.28,
    mapX(midFold - curve * 0.38), curlCH * 0.72,
    mapX(bottomFold), curlCH
  );
}

function drawPaperBackCurl(foldX, topOff, botOff, touchYRatio = 0.72, curlTilt = 0, side = 1) {
  const ctx = curlCtx;
  if (!ctx) return;
  foldX = clampRange(foldX, 0, curlCW);
  touchYRatio = clampRange(touchYRatio || 0.72, 0.10, 0.90);
  const progress = clampRange(1 - foldX / curlCW, 0, 1);
  const live = Math.sin(clampRange(progress, 0, 1) * Math.PI);
  const dragEase = smoothstep(0, 1, progress);
  const yAnchor = curlCH * touchYRatio;
  const tilt = clampRange(curlTilt + (touchYRatio - 0.5) * 0.18, -0.34, 0.34) * (0.22 + live * 0.78);
  const curve = curlCW * (0.020 + 0.022 * (1 - Math.abs(touchYRatio - 0.5) * 2)) * (0.5 + live * 0.5);
  const creaseAt = (y, bias = 0) => foldX + tilt * (y - yAnchor) + bias;
  const topFold = creaseAt(0, -curve * (0.42 + dragEase * 0.10));
  const midFold = creaseAt(curlCH * 0.5, curve * (0.08 + dragEase * 0.08));
  const bottomFold = creaseAt(curlCH, curve * (0.42 + dragEase * 0.12));
  const outerTopX = curlCW - curve * 0.14;
  const outerBottomX = curlCW - curve * 0.34;
  const mapX = (x) => side > 0 ? x : curlCW - x;
  const edgeX = side > 0 ? curlCW : 0;
  const farX = side > 0 ? 0 : curlCW;

  ctx.clearRect(0, 0, curlCW, curlCH);
  ctx.drawImage(botOff, 0, 0);

  if (foldX > 0.5 || live > 0.01) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(farX, 0);
    ctx.lineTo(mapX(topFold), 0);
    creasePathMapped(ctx, topFold, midFold, bottomFold, curve, mapX);
    ctx.lineTo(farX, curlCH);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(topOff, 0, 0);
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  creasePathMapped(ctx, topFold, midFold, bottomFold, curve, mapX);
  ctx.bezierCurveTo(
    mapX(outerBottomX) + side * curlCW * 0.018, curlCH * 0.82,
    edgeX, curlCH * 0.94,
    edgeX, curlCH
  );
  ctx.lineTo(edgeX, 0);
  ctx.bezierCurveTo(
    edgeX, curlCH * 0.06,
    mapX(outerTopX) + side * curlCW * 0.014, curlCH * 0.18,
    mapX(topFold), 0
  );
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = "#f7f4e8";
  ctx.fillRect(0, 0, curlCW, curlCH);

  const paperGrad = ctx.createLinearGradient(mapX(foldX), 0, edgeX, 0);
  paperGrad.addColorStop(0, `rgba(0,0,0,${0.18 + live * 0.12})`);
  paperGrad.addColorStop(0.12, `rgba(255,255,255,${0.46 + live * 0.16})`);
  paperGrad.addColorStop(0.55, "rgba(255,255,255,0.14)");
  paperGrad.addColorStop(1, `rgba(0,0,0,${0.10 + live * 0.08})`);
  ctx.fillStyle = paperGrad;
  ctx.fillRect(Math.min(topFold, bottomFold) - 8, 0, curlCW, curlCH);

  const grain = ctx.createLinearGradient(0, 0, curlCW, curlCH);
  grain.addColorStop(0, "rgba(255,255,255,0.18)");
  grain.addColorStop(0.5, "rgba(255,255,255,0)");
  grain.addColorStop(1, "rgba(0,0,0,0.06)");
  ctx.fillStyle = grain;
  ctx.fillRect(0, 0, curlCW, curlCH);
  ctx.restore();

  const shadowW = Math.max(18 * curlDpr, curlCW * (0.07 + live * 0.04));
  const shadowStart = mapX(foldX);
  const sg = ctx.createLinearGradient(shadowStart, 0, shadowStart + side * shadowW, 0);
  sg.addColorStop(0, `rgba(0,0,0,${0.20 + live * 0.16})`);
  sg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sg;
  if (side > 0) ctx.fillRect(shadowStart, 0, shadowW, curlCH);
  else ctx.fillRect(shadowStart - shadowW, 0, shadowW, curlCH);

  if (foldX > 0.5 || live > 0.01) {
    ctx.save();
    ctx.beginPath();
    creasePathMapped(ctx, topFold, midFold, bottomFold, curve, mapX);
    ctx.lineWidth = Math.max(1.4, curlDpr * 1.55);
    ctx.strokeStyle = `rgba(0,0,0,${0.12 + live * 0.13})`;
    ctx.stroke();
    ctx.lineWidth = Math.max(0.8, curlDpr * 0.95);
    ctx.strokeStyle = `rgba(255,255,255,${0.28 + live * 0.20})`;
    ctx.translate(side * Math.max(1, curlDpr * 1.4), 0);
    ctx.stroke();
    ctx.restore();
  }
}

// One page-turn frame. The raised page is paper back only, not distorted comic
// content. Prev-page turns are mirrored so the same geometry stays stable.
function drawCurlFrame(foldX, topOff, botOff, dir = 1, touchYRatio = 0.72, curlTilt = 0) {
  if (dir < 0) {
    drawPaperBackCurl(curlCW - foldX, topOff, botOff, touchYRatio, -curlTilt, -1);
    return;
  }
  drawPaperBackCurl(foldX, topOff, botOff, touchYRatio, curlTilt, 1);
}

// Animate the crease from startFold to the end. dir:+1 next, -1 prev.
function animateCurl(dir, startFold, touchYRatio = 0.72, curlTilt = 0) {
  if (curlBusy) return;
  const next = rPageIdx + dir;
  if (next < 0 || next >= readerPages.length) {
    if (next >= readerPages.length) { stopAuto(); toast(t("readerEnd"), "info"); }
    drawCurlStatic();
    return;
  }
  curlBusy = true;
  const topIdx = dir > 0 ? rPageIdx : next;
  const botIdx = dir > 0 ? next : rPageIdx;
  const fold0 = startFold != null ? startFold : (dir > 0 ? curlCW : 0);
  const fold1 = dir > 0 ? 0 : curlCW;

  renderPageToOff(curlOffA, topIdx);
  renderPageToOff(curlOffB, botIdx);
  const dist = Math.abs(fold1 - fold0) / Math.max(1, curlCW);
  const dur = Math.max(180, 430 * dist);
  const t0 = performance.now();
  cancelAnimationFrame(curlRAF);
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    const tension = 1 - Math.pow(1 - p, 2.2);
    drawCurlFrame(fold0 + (fold1 - fold0) * ease, curlOffA, curlOffB, dir, touchYRatio, curlTilt * (1 - tension * 0.45));
    if (p < 1) { curlRAF = requestAnimationFrame(tick); }
    else {
      rPageIdx = next; updateProgress();
      getCurlImg(rPageIdx - 1); getCurlImg(rPageIdx + 1);
      drawCurlStatic();
      curlBusy = false;
    }
  };
  curlRAF = requestAnimationFrame(tick);
}

// Roll the crease back to closed without changing the page.
function cancelCurl(dir, startFold, touchYRatio = 0.72, curlTilt = 0) {
  curlBusy = true;
  const topIdx = dir > 0 ? rPageIdx : rPageIdx + dir;
  const botIdx = dir > 0 ? rPageIdx + dir : rPageIdx;
  renderPageToOff(curlOffA, topIdx);
  renderPageToOff(curlOffB, botIdx);
  const fold1 = dir > 0 ? curlCW : 0;
  const dist = Math.abs(fold1 - startFold) / Math.max(1, curlCW);
  const dur = Math.max(120, 210 * dist);
  const t0 = performance.now();
  cancelAnimationFrame(curlRAF);
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const ease = 1 - Math.pow(1 - p, 2.8);
    drawCurlFrame(startFold + (fold1 - startFold) * ease, curlOffA, curlOffB, dir, touchYRatio, curlTilt * (1 - p * 0.8));
    if (p < 1) { curlRAF = requestAnimationFrame(tick); }
    else { drawCurlStatic(); curlBusy = false; }
  };
  curlRAF = requestAnimationFrame(tick);
}

function flipNextPage() { if (!curlBusy) animateCurl(1); }
function flipPrevPage() { if (!curlBusy) animateCurl(-1); }

function attachCurlGestures(canvas) {
  let sx = 0, sy = 0, st = 0, moved = false, dir = 0, dragging = false, lastTap = 0, touchYRatio = 0.72, curlTilt = 0, liveFold = 0;

  const tapZone = (clientX) => {
    const r = canvas.getBoundingClientRect();
    const x = clientX - r.left;
    if (x < r.width * 0.28) flipPrevPage();
    else if (x > r.width * 0.72) flipNextPage();
    else toggleControls();
  };

  const foldFromDelta = (dx) => {
    const d = dx * curlDpr;
    return dir > 0
      ? Math.max(0, Math.min(curlCW, curlCW + d))
      : Math.max(0, Math.min(curlCW, d));
  };

  canvas.addEventListener("touchstart", (e) => {
    if (curlBusy || e.touches.length !== 1) { dragging = false; return; }
    const r = canvas.getBoundingClientRect();
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
    touchYRatio = clampRange((sy - r.top) / Math.max(1, r.height), 0.12, 0.88);
    moved = false; dir = 0; dragging = true; curlTilt = 0; liveFold = 0;
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!dragging || e.touches.length !== 1) return;
    const x = e.touches[0].clientX, y = e.touches[0].clientY;
    const dx = x - sx, dy = y - sy;
    if (!moved && Math.abs(dx) > 4 && Math.abs(dx) > Math.abs(dy) * 0.82) {
      dir = dx < 0 ? 1 : -1;
      if (rPageIdx + dir < 0 || rPageIdx + dir >= readerPages.length) { dragging = false; return; }
      moved = true;
      renderPageToOff(curlOffA, dir > 0 ? rPageIdx : rPageIdx + dir);
      renderPageToOff(curlOffB, dir > 0 ? rPageIdx + dir : rPageIdx);
    }
    if (moved && dir !== 0) {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const liveTouchY = clampRange((y - r.top) / Math.max(1, r.height), 0.10, 0.90);
      touchYRatio = touchYRatio * 0.6 + liveTouchY * 0.4;
      const dragSlope = dy / Math.max(45, Math.abs(dx) * 0.95);
      curlTilt = clampRange(dragSlope * 0.28, -0.30, 0.30);
      liveFold = foldFromDelta(dx);
      drawCurlFrame(liveFold, curlOffA, curlOffB, dir, touchYRatio, curlTilt);
    }
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    if (!dragging) return;
    dragging = false;
    const dt = Date.now() - st;
    if (!moved) { if (dt < 300) { lastTap = Date.now(); tapZone(sx); } return; }
    const dx = e.changedTouches[0].clientX - sx;
    const fold = foldFromDelta(dx);
    const frac = fold / curlCW;
    const flick = dt < 300 && Math.abs(dx) > 16;
    if (dir > 0) { (flick || frac < 0.76) ? animateCurl(1, fold, touchYRatio, curlTilt) : cancelCurl(1, fold, touchYRatio, curlTilt); }
    else { (flick || frac > 0.24) ? animateCurl(-1, fold, touchYRatio, curlTilt) : cancelCurl(-1, fold, touchYRatio, curlTilt); }
  }, { passive: true });

  canvas.addEventListener("click", (e) => {
    if (Date.now() - lastTap < 600) return;
    tapZone(e.clientX);
  });
}

function destroyPageFlip() {
  destroyLibraryPageFlip();
  cancelClickSlide(true);
  curlBusy = false;
  if (curlRAF) cancelAnimationFrame(curlRAF);
  curlCanvas = null; curlCtx = null;
  curlImgCache.clear();
  readerImageZoomed = false;
}

/* ===== CLICK-MODE FINGER-FOLLOW SLIDE ===== */
let clickSlideRAF = null;
let clickSlideBusy = false;
let clickSwipeLastTouch = 0;

function ignoreClickSwipeTap() {
  return Date.now() - clickSwipeLastTouch < 450;
}

function getClickBox() {
  return document.querySelector(".r-swipe-box");
}

function getClickCurrentImg() {
  return document.querySelector(".r-swipe-box .r-click-page.current");
}

function setClickSlideOffset(state, offset) {
  if (!state || !state.current || !state.incoming) return;
  state.offset = offset;
  const incomingX = offset + state.dir * state.width;
  const progress = Math.min(1, Math.abs(offset) / Math.max(1, state.width));
  state.current.style.transition = "none";
  state.incoming.style.transition = "none";
  state.current.style.transform = `translate3d(${offset}px,0,0)`;
  state.incoming.style.transform = `translate3d(${incomingX}px,0,0)`;
  state.current.style.filter = `brightness(${1 - progress * 0.045})`;
  state.incoming.style.filter = `drop-shadow(${-state.dir * 18}px 0 22px rgba(0,0,0,${0.12 + progress * 0.14}))`;
}

function prepareClickSlide(dir) {
  const next = rPageIdx + dir;
  if (next < 0 || next >= readerPages.length) return null;
  const box = getClickBox();
  const current = getClickCurrentImg();
  if (!box || !current) return null;

  if (current._resetZoom) current._resetZoom();
  readerImageZoomed = false;
  current.style.transition = "none";

  box.querySelectorAll(".r-click-page.incoming").forEach(el => el.remove());
  const incoming = document.createElement("img");
  incoming.className = "r-click-page incoming";
  setReaderImgSrc(incoming, next);
  incoming.alt = `Page ${next + 1}`;
  incoming.style.transition = "none";
  box.appendChild(incoming);

  const state = {
    box,
    current,
    incoming,
    dir,
    next,
    width: Math.max(1, box.clientWidth || window.innerWidth || 1),
    offset: 0
  };
  setClickSlideOffset(state, 0);
  return state;
}

function finishClickSlide(state, commit) {
  if (!state) return;
  if (commit) {
    rPageIdx = state.next;
    updateProgress();
    setReaderImgSrc(state.current, rPageIdx);
  }
  state.current.style.transition = "none";
  state.current.style.transform = "translate3d(0,0,0)";
  state.current.style.filter = "";
  if (state.incoming) state.incoming.remove();
  clickSlideBusy = false;
}

function cancelClickSlide(resetOnly) {
  if (clickSlideRAF) cancelAnimationFrame(clickSlideRAF);
  clickSlideRAF = null;
  clickSlideBusy = false;
  const current = getClickCurrentImg();
  if (current) {
    current.style.transition = "none";
    current.style.transform = "translate3d(0,0,0)";
    current.style.filter = "";
  }
  document.querySelectorAll(".r-swipe-box .r-click-page.incoming").forEach(el => el.remove());
  if (!resetOnly) readerImageZoomed = false;
}

function animateClickSlide(dir, startOffset = 0, commit = true, state = null) {
  if (clickSlideBusy) return false;
  const slide = state || prepareClickSlide(dir);
  if (!slide) return false;
  clickSlideBusy = true;
  const endOffset = commit ? -dir * slide.width : 0;
  const dist = Math.abs(endOffset - startOffset) / Math.max(1, slide.width);
  const dur = Math.max(130, Math.min(320, 120 + dist * 260));
  const t0 = performance.now();
  cancelAnimationFrame(clickSlideRAF);

  const tick = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const ease = 1 - Math.pow(1 - p, 3);
    setClickSlideOffset(slide, startOffset + (endOffset - startOffset) * ease);
    if (p < 1) clickSlideRAF = requestAnimationFrame(tick);
    else {
      clickSlideRAF = null;
      finishClickSlide(slide, commit);
    }
  };
  clickSlideRAF = requestAnimationFrame(tick);
  return true;
}

/* ===== SWIPE GESTURES ===== */
let readerGesturesBound = false;
function initReaderGestures() {
  if (readerGesturesBound) return;
  readerGesturesBound = true;
  const canvas = document.getElementById("readerCanvas");
  if (!canvas) return;
  let sx = 0, sy = 0, st = 0, tracking = false, moved = false;
  let slideDir = 0, slideState = null, slideOffset = 0;

  canvas.addEventListener("touchstart", (e) => {
    // Click mode swipe. Flip mode has its own drag-curl on the canvas;
    // slide/webtoon use native scroll. Skip when zoomed or multi-touch.
    if (rMode !== "click" || readerImageZoomed || clickSlideBusy || e.touches.length > 1) { tracking = false; return; }
    const tch = e.touches[0];
    sx = tch.clientX; sy = tch.clientY; st = Date.now(); tracking = true; moved = false;
    slideDir = 0; slideState = null; slideOffset = 0;
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!tracking || e.touches.length !== 1) return;
    const tch = e.touches[0];
    const dx = tch.clientX - sx;
    const dy = tch.clientY - sy;

    if (!moved) {
      if (Math.abs(dx) < 5 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
      slideDir = dx < 0 ? 1 : -1;
      slideState = prepareClickSlide(slideDir);
      if (!slideState) { tracking = false; return; }
      moved = true;
    }

    e.preventDefault();
    slideOffset = slideDir > 0
      ? clampRange(dx, -slideState.width, 0)
      : clampRange(dx, 0, slideState.width);
    setClickSlideOffset(slideState, slideOffset);
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;
    const tch = e.changedTouches[0];
    const dx = tch.clientX - sx;
    const dy = tch.clientY - sy;
    const dt = Date.now() - st;

    if (!moved || !slideState) return;
    clickSwipeLastTouch = Date.now();
    const progress = Math.abs(slideOffset) / Math.max(1, slideState.width);
    const flick = Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.2 && dt < 400;
    const commit = flick || progress > 0.22;
    animateClickSlide(slideDir, slideOffset, commit, slideState);
  }, { passive: true });

  canvas.addEventListener("touchcancel", () => {
    if (tracking && moved && slideState) {
      clickSwipeLastTouch = Date.now();
      animateClickSlide(slideDir, slideOffset, false, slideState);
    }
    tracking = false;
  }, { passive: true });
}

/* ===== PAGE NAVIGATION ===== */
function flipPage(dir, corner = "top") {
  if (rMode === "flip") {
    if (!pageFlipBook) return;
    const current = typeof pageFlipBook.getCurrentPageIndex === "function"
      ? pageFlipBook.getCurrentPageIndex()
      : rPageIdx;
    if (Number.isFinite(current) && current !== rPageIdx) {
      rPageIdx = Math.max(0, Math.min(readerPages.length - 1, current));
      updateProgress();
    }
    const next = rPageIdx + dir;
    if (next < 0 || next >= readerPages.length) {
      if (next >= readerPages.length) { stopAuto(); toast(t("readerEnd"), "info"); }
      return;
    }
    if (typeof pageFlipBook.getState === "function" && pageFlipBook.getState() !== "read") return;
    pageFlipBook.flip(next, corner);
    return;
  }
  const next = rPageIdx + dir;
  if (next < 0 || next >= readerPages.length) {
    if (next >= readerPages.length) { stopAuto(); toast(t("readerEnd"), "info"); }
    return;
  }
  if (rMode === "click") {
    if (animateClickSlide(dir, 0, true)) return;
    rPageIdx = next; updateProgress();
    const img = getClickCurrentImg() || document.querySelector(".r-page-img-box img");
    if (img) { if (img._resetZoom) img._resetZoom(); readerImageZoomed = false; setReaderImgSrc(img, rPageIdx); }
  } else if (rMode === "slide") {
    rPageIdx = next; updateProgress();
    const wrap = document.getElementById("hScroll");
    if (wrap) wrap.scrollLeft = rPageIdx * wrap.clientWidth;
  } else {
    rPageIdx = next; updateProgress();
  }
}

function jumpPage(idx) {
  rPageIdx = idx; updateProgress();
  if (rMode === "click") {
    cancelClickSlide(true);
    const img = getClickCurrentImg() || document.querySelector(".r-page-img-box img");
    if (img) setReaderImgSrc(img, rPageIdx);
  } else if (rMode === "flip") {
    if (pageFlipBook) pageFlipBook.turnToPage(rPageIdx);
  } else if (rMode === "slide") {
    const wrap = document.getElementById("hScroll");
    if (wrap) wrap.scrollLeft = rPageIdx * wrap.clientWidth;
  } else if (rMode === "webtoon") {
    const wrap = document.getElementById("vScroll");
    const el = document.getElementById(`vp-${rPageIdx}`);
    if (wrap && el) wrap.scrollTop = el.offsetTop;
  }
}

/* ===== CONTROLS TOGGLE ===== */
function toggleControls() {
  const top = document.getElementById("readerTop");
  const ctrl = document.getElementById("readerControls");
  // Currently shown -> hide everything (immersive); otherwise show both.
  const hide = !top.classList.contains("hidden");
  top.classList.toggle("hidden", hide);
  ctrl.classList.toggle("visible", !hide);
}

/* ===== CHAPTER DRAWER (bottom thumbnail grid) ===== */
function openSidebar() {
  const list = document.getElementById("sidebarList");
  if (list) {
    list.innerHTML = "";
    for (let i = 0; i < readerPages.length; i++) {
      const item = document.createElement("div");
      item.className = "grid-thumb" + (i === rPageIdx ? " active" : "");
      const img = document.createElement("img");
      img.loading = "lazy";
      setReaderImgSrc(img, i);
      const num = document.createElement("span");
      num.className = "grid-num";
      num.textContent = i + 1;
      item.appendChild(img);
      item.appendChild(num);
      item.onclick = () => { rPageIdx = i; updateProgress(); jumpPage(i); closeSidebar(); };
      list.appendChild(item);
    }
  }
  document.getElementById("readerSidebar").classList.add("active");
  document.getElementById("readerSidebarBackdrop")?.classList.add("active");
  setTimeout(() => {
    const active = document.querySelector(".grid-thumb.active");
    if (active) active.scrollIntoView({ block: "nearest" });
  }, 60);
}

function closeSidebar() {
  document.getElementById("readerSidebar").classList.remove("active");
  document.getElementById("readerSidebarBackdrop")?.classList.remove("active");
}

function toggleSidebar() {
  const open = document.getElementById("readerSidebar").classList.contains("active");
  if (open) closeSidebar(); else openSidebar();
}

/* ===== PAGE FAN (progress bar replaced by a symmetric thumbnail fan) =====
   Scrolling the fan turns pages live; the main reading area follows. */
let pfPos = 0;             // floating current-page position; integer = centered
let pfVel = 0;             // pages/second (for inertia)
let pfRAF = null;
let pfSlots = [];
let pfDragging = false;
let pfBound = false;
const PF_SLOTS = 7;
const PF_ANGLE = 20;       // degrees per page of separation
const PF_FRICTION = 0.92;
const PF_PX_PER_PAGE = 72; // drag pixels per page (smaller = faster scroll)

function buildPageFan() {
  const host = document.getElementById("pageFan");
  if (!host) return;
  host.innerHTML = "";
  pfSlots = [];
  for (let i = 0; i < PF_SLOTS; i++) {
    const item = document.createElement("div");
    item.className = "pf-item";
    item._idx = null;
    const img = document.createElement("img");
    const num = document.createElement("span");
    num.className = "pf-num";
    item.appendChild(img);
    item.appendChild(num);
    item.addEventListener("click", () => {
      if (item._idx == null) return;
      animatePageFanTo(item._idx, true);
    });
    host.appendChild(item);
    pfSlots.push(item);
  }
  initPageFanGestures();
  pfPos = rPageIdx;
  layoutPageFan();
}

function layoutPageFan() {
  if (!pfSlots.length) return;
  const host = document.getElementById("pageFan");
  const total = readerPages.length;
  const cw = host ? host.clientWidth : 320;
  // Horizontal spacing adapts to screen width so cards aren't cramped:
  // ~5 cards should comfortably span the available width.
  const spacing = Math.max(48, Math.min(132, cw / 4.4));
  const tilt = 12; // degrees of lean per page (fan look)

  const lo = Math.floor(pfPos) - 3, hi = Math.floor(pfPos) + 3;
  const need = [];
  for (let i = lo; i <= hi; i++) if (i >= 0 && i < total) need.push(i);
  const needSet = new Set(need);
  const have = new Map();
  pfSlots.forEach(s => { if (s._idx != null && needSet.has(s._idx)) have.set(s._idx, s); });
  const free = pfSlots.filter(s => s._idx == null || !needSet.has(s._idx));
  const base = Math.round(pfPos);

  need.forEach(idx => {
    let s = have.get(idx);
    if (!s) {
      s = free.pop();
      if (!s) return;
      s._idx = idx;
      setReaderImgSrc(s.querySelector("img"), idx);
      s.querySelector(".pf-num").textContent = idx + 1;
    }
    const rel = idx - pfPos;
    const absRel = Math.min(Math.abs(rel), 3);
    const x = rel * spacing;
    const angle = Math.max(-2.6, Math.min(2.6, rel)) * tilt;
    const y = absRel * absRel * 7;            // outer cards dip slightly -> arc
    const scale = 1.16 - absRel * 0.12;
    s.style.transform = `translateX(${x}px) translateY(${y}px) rotate(${angle}deg) scale(${scale})`;
    s.style.zIndex = String(100 - Math.round(absRel * 10));
    s.style.opacity = String(Math.max(0.3, 1 - absRel * 0.2));
    s.classList.toggle("center", idx === base);
    s.style.display = "";
  });
  pfSlots.forEach(s => { if (s._idx == null || !needSet.has(s._idx)) s.style.display = "none"; });
}

function pfClamp() {
  const max = readerPages.length - 1;
  if (pfPos < 0) { pfPos = 0; pfVel = 0; }
  else if (pfPos > max) { pfPos = max; pfVel = 0; }
}

// Live-update the main reading area as the fan scrolls (cheap for click mode).
function syncReaderLive(idx) {
  idx = Math.max(0, Math.min(readerPages.length - 1, idx));
  if (idx === rPageIdx) return;
  rPageIdx = idx;
  document.getElementById("readerPageIndicator").textContent =
    `${String(idx + 1).padStart(2, "0")}/${readerPages.length}`;
  if (rMode === "click") {
    const img = document.querySelector(".r-page-img-box img");
    if (img) { if (img._resetZoom) img._resetZoom(); setReaderImgSrc(img, idx); }
  }
}

function pfApply() {
  layoutPageFan();
  syncReaderLive(Math.round(pfPos));
}

// After the fan settles, fully sync the active mode (flip/slide/webtoon).
function commitReaderPage() {
  jumpPage(rPageIdx);
}

function pfInertia() {
  cancelAnimationFrame(pfRAF);
  let last = performance.now();
  const step = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    pfPos += pfVel * dt;
    pfVel *= PF_FRICTION;
    pfClamp();
    pfApply();
    if (Math.abs(pfVel) > 0.15) pfRAF = requestAnimationFrame(step);
    else pfSnap();
  };
  pfRAF = requestAnimationFrame(step);
}

function pfSnap() {
  cancelAnimationFrame(pfRAF);
  const target = Math.max(0, Math.min(readerPages.length - 1, Math.round(pfPos)));
  const step = () => {
    pfPos += (target - pfPos) * 0.25;
    if (Math.abs(target - pfPos) < 0.01) { pfPos = target; pfApply(); commitReaderPage(); return; }
    pfApply();
    pfRAF = requestAnimationFrame(step);
  };
  pfRAF = requestAnimationFrame(step);
}

function animatePageFanTo(idx, commit) {
  cancelAnimationFrame(pfRAF);
  const target = Math.max(0, Math.min(readerPages.length - 1, idx));
  const step = () => {
    pfPos += (target - pfPos) * 0.25;
    if (Math.abs(target - pfPos) < 0.01) { pfPos = target; pfApply(); if (commit) commitReaderPage(); return; }
    pfApply();
    pfRAF = requestAnimationFrame(step);
  };
  pfRAF = requestAnimationFrame(step);
}

function pageFanStep(dir) {
  animatePageFanTo(Math.round(pfPos) + dir, true);
}

function initPageFanGestures() {
  if (pfBound) return;
  const host = document.getElementById("pageFan");
  if (!host) return;
  pfBound = true;
  let startX = 0, startPos = 0, lastX = 0, lastT = 0, moved = false;

  host.addEventListener("touchstart", (e) => {
    cancelAnimationFrame(pfRAF);
    pfDragging = true; moved = false;
    startX = lastX = e.touches[0].clientX;
    startPos = pfPos;
    lastT = performance.now();
    pfVel = 0;
  }, { passive: true });

  host.addEventListener("touchmove", (e) => {
    if (!pfDragging) return;
    const x = e.touches[0].clientX;
    if (Math.abs(x - startX) > 4) moved = true;
    const now = performance.now();
    pfPos = startPos - (x - startX) / PF_PX_PER_PAGE;
    pfClamp();
    pfApply();
    const dt = (now - lastT) / 1000;
    if (dt > 0) pfVel = -((x - lastX) / PF_PX_PER_PAGE) / dt; // speed-sensitive
    lastX = x; lastT = now;
  }, { passive: true });

  host.addEventListener("touchend", () => {
    if (!pfDragging) return;
    pfDragging = false;
    if (!moved) return;                       // tap -> card click handler
    if (Math.abs(pfVel) > 0.4) pfInertia();
    else pfSnap();
  }, { passive: true });

  host.addEventListener("wheel", (e) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 6) return;
    e.preventDefault();
    pageFanStep(d > 0 ? 1 : -1);
  }, { passive: false });
}

/* ===== AUTO PLAY ===== */
function toggleAutoPlay() {
  if (rAutoPlaying) stopAuto(); else startAuto();
}

function startAuto() {
  rAutoPlaying = true;
  const btn = document.getElementById("rAutoBtn");
  btn.classList.add("active");
  btn.querySelector("span").textContent = t("pause");

  rAutoTimer = setInterval(() => {
    if (rMode === "webtoon") {
      const wrap = document.getElementById("vScroll");
      if (wrap) {
        wrap.scrollBy({ top: wrap.clientHeight * 0.8, behavior: "smooth" });
        if (Math.ceil(wrap.scrollTop + wrap.clientHeight) >= wrap.scrollHeight) { stopAuto(); toast(t("readerEnd"), "info"); }
      }
    } else {
      if (rPageIdx < readerPages.length - 1) {
        flipPage(1);
      } else { stopAuto(); toast(t("readerEnd"), "info"); }
    }
  }, rAutoSpeed * 1000);
}

function stopAuto() {
  rAutoPlaying = false;
  if (rAutoTimer) { clearInterval(rAutoTimer); rAutoTimer = null; }
  const btn = document.getElementById("rAutoBtn");
  if (btn) { btn.classList.remove("active"); btn.querySelector("span").textContent = t("autoPlay"); }
}

/* ===== CLOSE BTN BINDING ===== */
// Already bound inline in HTML
