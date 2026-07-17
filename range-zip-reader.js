/* ===== RANGE-BASED ZIP/CBZ READER =====
 * Large ZIP files are indexed from their central directory and each image is
 * fetched/decompressed only when that page is requested. This avoids rebuilding
 * the whole IndexedDB file and avoids JSZip loading the entire archive in memory.
 */
(() => {
  const RANGE_SOURCE_MARKER = "__pmRangeZipSource";
  const RANGE_PAGE_CACHE_RADIUS = 2;

  window.createRangeZipSource = function createRangeZipSource(file) {
    if (!file || file.isPrivate) return null;
    return {
      [RANGE_SOURCE_MARKER]: true,
      storage: file.isChunked ? "idb" : "blob",
      id: file.id,
      name: file.name,
      size: Number(file.size || file.data?.size || 0),
      blob: file.isChunked ? null : file.data,
      dbName: DB,
      chunkStore: CHUNK_STORE,
      chunkSize: Number(file.chunkSize || IDB_CHUNK_BYTES)
    };
  };

  function isRangeZipSource(source) {
    return !!source?.[RANGE_SOURCE_MARKER] && source.size > 0;
  }

  function createRangeZipWorkerSource() {
    return `
      let source = null;
      let database = null;
      let entries = [];
      let pakoReady = false;
      const chunkCache = new Map();
      const MAX_CACHE_CHUNKS = 8;
      const MAX_CENTRAL_DIRECTORY_BYTES = 128 * 1024 * 1024;
      const MAX_SINGLE_PAGE_BYTES = 256 * 1024 * 1024;

      function readU16(view, offset) {
        return view.getUint16(offset, true);
      }

      function readU32(view, offset) {
        return view.getUint32(offset, true);
      }

      function readU64(view, offset) {
        if (typeof view.getBigUint64 === "function") {
          const value = view.getBigUint64(offset, true);
          if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("ZIP64 value is too large");
          return Number(value);
        }
        return readU32(view, offset) + readU32(view, offset + 4) * 4294967296;
      }

      function decodeName(bytes) {
        try {
          return new TextDecoder("utf-8").decode(bytes);
        } catch (_) {
          return Array.from(bytes, byte => String.fromCharCode(byte)).join("");
        }
      }

      function isImageName(name) {
        return /\\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(name || "");
      }

      function isNoisePath(name) {
        return !name
          || name.endsWith("/")
          || name.startsWith("__MACOSX/")
          || name.startsWith(".")
          || /(^|\\/)\\./.test(name);
      }

      function mimeForName(name) {
        const ext = String(name || "").split(".").pop().toLowerCase();
        if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
        if (ext === "png") return "image/png";
        if (ext === "gif") return "image/gif";
        if (ext === "webp") return "image/webp";
        if (ext === "bmp") return "image/bmp";
        if (ext === "svg") return "image/svg+xml";
        if (ext === "avif") return "image/avif";
        return "application/octet-stream";
      }

      function openDatabase() {
        if (database) return Promise.resolve(database);
        return new Promise((resolve, reject) => {
          const request = indexedDB.open(source.dbName);
          request.onsuccess = () => {
            database = request.result;
            database.onversionchange = () => database.close();
            resolve(database);
          };
          request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
        });
      }

      function normalizeChunkData(value) {
        const raw = value?.data;
        if (raw instanceof ArrayBuffer) return Promise.resolve(new Uint8Array(raw));
        if (ArrayBuffer.isView(raw)) {
          return Promise.resolve(new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength));
        }
        if (raw instanceof Blob) return raw.arrayBuffer().then(buffer => new Uint8Array(buffer));
        return Promise.reject(new Error("IndexedDB chunk missing"));
      }

      async function getChunk(index) {
        if (chunkCache.has(index)) {
          const cached = chunkCache.get(index);
          chunkCache.delete(index);
          chunkCache.set(index, cached);
          return cached;
        }
        const db = await openDatabase();
        const value = await new Promise((resolve, reject) => {
          const tx = db.transaction(source.chunkStore, "readonly");
          const request = tx.objectStore(source.chunkStore).get(String(source.id) + ":" + String(index));
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error || new Error("IndexedDB chunk read failed"));
        });
        if (!value) throw new Error("IndexedDB chunk missing: " + index);
        const bytes = await normalizeChunkData(value);
        chunkCache.set(index, bytes);
        while (chunkCache.size > MAX_CACHE_CHUNKS) {
          chunkCache.delete(chunkCache.keys().next().value);
        }
        return bytes;
      }

      async function readIdbRange(start, end) {
        const length = end - start;
        const output = new Uint8Array(length);
        const chunkSize = source.chunkSize;
        const first = Math.floor(start / chunkSize);
        const last = Math.floor((end - 1) / chunkSize);
        let written = 0;
        for (let index = first; index <= last; index++) {
          const chunk = await getChunk(index);
          const chunkStart = index * chunkSize;
          const from = Math.max(0, start - chunkStart);
          const to = Math.min(chunk.length, end - chunkStart);
          if (to <= from) throw new Error("IndexedDB chunk is shorter than expected: " + index);
          output.set(chunk.subarray(from, to), written);
          written += to - from;
        }
        if (written !== length) throw new Error("IndexedDB range is incomplete");
        return output;
      }

      async function readRange(start, end) {
        const safeStart = Math.max(0, Math.floor(start));
        const safeEnd = Math.min(source.size, Math.floor(end));
        if (safeEnd <= safeStart) return new Uint8Array(0);
        if (source.storage === "blob") {
          return new Uint8Array(await source.blob.slice(safeStart, safeEnd).arrayBuffer());
        }
        return readIdbRange(safeStart, safeEnd);
      }

      function findEndOfCentralDirectory(tail) {
        if (tail.length < 22) return -1;
        const view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
        for (let offset = tail.length - 22; offset >= 0; offset--) {
          if (readU32(view, offset) === 0x06054b50) return offset;
        }
        return -1;
      }

      async function readCentralDirectoryLocation() {
        const tailLength = Math.min(source.size, 1024 * 1024);
        const tailStart = source.size - tailLength;
        const tail = await readRange(tailStart, source.size);
        const eocdOffset = findEndOfCentralDirectory(tail);
        if (eocdOffset < 0) throw new Error("ZIP central directory was not found");
        const view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
        const diskNumber = readU16(view, eocdOffset + 4);
        const centralDisk = readU16(view, eocdOffset + 6);
        if (diskNumber !== 0 || centralDisk !== 0) throw new Error("Multi-volume ZIP is not supported");

        let total = readU16(view, eocdOffset + 10);
        let size = readU32(view, eocdOffset + 12);
        let offset = readU32(view, eocdOffset + 16);
        const needsZip64 = total === 0xffff || size === 0xffffffff || offset === 0xffffffff;
        if (!needsZip64) return { total, size, offset };

        let locatorOffset = -1;
        for (let cursor = eocdOffset - 20; cursor >= Math.max(0, eocdOffset - 4096); cursor--) {
          if (readU32(view, cursor) === 0x07064b50) {
            locatorOffset = cursor;
            break;
          }
        }
        if (locatorOffset < 0) throw new Error("ZIP64 locator was not found");
        const zip64Offset = readU64(view, locatorOffset + 8);
        const record = await readRange(zip64Offset, zip64Offset + 56);
        if (record.length < 56) throw new Error("ZIP64 record is incomplete");
        const recordView = new DataView(record.buffer, record.byteOffset, record.byteLength);
        if (readU32(recordView, 0) !== 0x06064b50) throw new Error("Invalid ZIP64 record");
        total = readU64(recordView, 32);
        size = readU64(recordView, 40);
        offset = readU64(recordView, 48);
        return { total, size, offset };
      }

      function applyZip64Extra(view, start, length, entry) {
        let cursor = start;
        const end = start + length;
        while (cursor + 4 <= end) {
          const id = readU16(view, cursor);
          const fieldLength = readU16(view, cursor + 2);
          cursor += 4;
          const fieldEnd = cursor + fieldLength;
          if (fieldEnd > end) break;
          if (id === 0x0001) {
            let valueOffset = cursor;
            if (entry.uncompressedSize === 0xffffffff && valueOffset + 8 <= fieldEnd) {
              entry.uncompressedSize = readU64(view, valueOffset);
              valueOffset += 8;
            }
            if (entry.compressedSize === 0xffffffff && valueOffset + 8 <= fieldEnd) {
              entry.compressedSize = readU64(view, valueOffset);
              valueOffset += 8;
            }
            if (entry.localOffset === 0xffffffff && valueOffset + 8 <= fieldEnd) {
              entry.localOffset = readU64(view, valueOffset);
            }
            return;
          }
          cursor = fieldEnd;
        }
      }

      async function indexArchive() {
        const location = await readCentralDirectoryLocation();
        if (!location.size || location.size > MAX_CENTRAL_DIRECTORY_BYTES) {
          throw new Error("ZIP central directory is too large");
        }
        if (location.offset + location.size > source.size) {
          throw new Error("ZIP central directory is outside the file");
        }
        const bytes = await readRange(location.offset, location.offset + location.size);
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const found = [];
        let cursor = 0;
        while (cursor + 46 <= bytes.length) {
          if (readU32(view, cursor) !== 0x02014b50) break;
          const flags = readU16(view, cursor + 8);
          const method = readU16(view, cursor + 10);
          const nameLength = readU16(view, cursor + 28);
          const extraLength = readU16(view, cursor + 30);
          const commentLength = readU16(view, cursor + 32);
          const nameStart = cursor + 46;
          const extraStart = nameStart + nameLength;
          const next = extraStart + extraLength + commentLength;
          if (next > bytes.length) throw new Error("ZIP central directory entry is incomplete");

          const entry = {
            name: decodeName(bytes.subarray(nameStart, extraStart)),
            flags,
            method,
            compressedSize: readU32(view, cursor + 20),
            uncompressedSize: readU32(view, cursor + 24),
            localOffset: readU32(view, cursor + 42)
          };
          applyZip64Extra(view, extraStart, extraLength, entry);
          if (!(flags & 1)
            && (method === 0 || method === 8)
            && !isNoisePath(entry.name)
            && isImageName(entry.name)
            && entry.compressedSize >= 0
            && entry.uncompressedSize >= 0) {
            found.push(entry);
          }
          cursor = next;
        }
        found.sort((a, b) => a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: "base"
        }));
        return found;
      }

      async function readPage(entry) {
        if (entry.compressedSize > MAX_SINGLE_PAGE_BYTES || entry.uncompressedSize > MAX_SINGLE_PAGE_BYTES) {
          throw new Error("A single image in this archive is too large");
        }
        const header = await readRange(entry.localOffset, entry.localOffset + 30);
        if (header.length < 30) throw new Error("ZIP local header is incomplete");
        const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
        if (readU32(view, 0) !== 0x04034b50) throw new Error("Invalid ZIP local header");
        const nameLength = readU16(view, 26);
        const extraLength = readU16(view, 28);
        const dataStart = entry.localOffset + 30 + nameLength + extraLength;
        const compressed = await readRange(dataStart, dataStart + entry.compressedSize);
        let output = compressed;
        if (entry.method === 8) {
          if (!pakoReady) {
            importScripts(source.pakoUrl);
            pakoReady = true;
          }
          output = self.pako.inflateRaw(compressed);
        }
        return new Blob([output], { type: mimeForName(entry.name) });
      }

      self.onmessage = async event => {
        const data = event.data || {};
        try {
          if (data.type === "init") {
            source = data.source;
            entries = await indexArchive();
            self.postMessage({
              type: "ready",
              names: entries.map(entry => entry.name),
              total: entries.length
            });
            return;
          }
          if (data.type === "page") {
            const entry = entries[data.idx];
            if (!entry) throw new Error("Page not found");
            const blob = await readPage(entry);
            self.postMessage({ type: "page", idx: data.idx, blob });
          }
        } catch (error) {
          self.postMessage({
            type: "error",
            idx: data.idx,
            error: error?.message || String(error)
          });
        }
      };
    `;
  }

  function createRangeZipReader(source, name) {
    stopReaderLazyWorker();
    const workerUrl = URL.createObjectURL(new Blob(
      [createRangeZipWorkerSource()],
      { type: "application/javascript" }
    ));
    const worker = new Worker(workerUrl);
    URL.revokeObjectURL(workerUrl);
    worker.__pmRangeZipReader = true;
    readerLazyWorker = worker;

    return new Promise((resolve, reject) => {
      const cleanupInit = () => {
        worker.removeEventListener("message", onInitMessage);
        worker.removeEventListener("error", onInitError);
      };
      const fail = error => {
        cleanupInit();
        stopReaderLazyWorker();
        reject(error instanceof Error ? error : new Error(String(error)));
      };
      const onInitError = event => fail(new Error(event.message || "Range ZIP reader failed"));
      const onInitMessage = event => {
        const data = event.data || {};
        if (data.type === "ready") {
          cleanupInit();
          readerLazyPageNames = data.names || [];
          readerLazyMode = true;
          resolve({
            lazy: true,
            names: readerLazyPageNames,
            total: data.total || 0,
            size: source.size,
            name
          });
        } else if (data.type === "error") {
          fail(new Error(data.error || "Range ZIP reader failed"));
        }
      };
      worker.addEventListener("message", onInitMessage);
      worker.addEventListener("error", onInitError);
      worker.addEventListener("message", handleLazyReaderMessage);
      worker.postMessage({
        type: "init",
        source: {
          ...source,
          pakoUrl: new URL("lib/pako.min.js", location.href).href
        }
      });
    });
  }

  const extractImagesForReaderFallback = extractImagesForReader;
  extractImagesForReader = async function extractImagesForReaderWithRanges(name, source) {
    if (isRangeZipSource(source)) return createRangeZipReader(source, name);
    return extractImagesForReaderFallback(name, source);
  };

  const revokeDistantReaderUrlsFallback = revokeDistantReaderUrls;
  revokeDistantReaderUrls = function revokeDistantReaderRanges(centerIdx) {
    revokeDistantReaderUrlsFallback(centerIdx);
    if (!readerLazyWorker?.__pmRangeZipReader) return;
    for (let index = 0; index < readerImageBlobs.length; index++) {
      if (Math.abs(index - centerIdx) <= RANGE_PAGE_CACHE_RADIUS) continue;
      if (readerPages[index]) {
        URL.revokeObjectURL(readerPages[index]);
        readerPages[index] = null;
      }
      readerImageBlobs[index] = null;
    }
  };
})();
