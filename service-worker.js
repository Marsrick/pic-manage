const CACHE_VERSION = "pic-manage-v29";
const MEDIA_ROUTE = "/__pic_manage_media__";
const MEDIA_DB_NAME = "PicManageDB";
const MEDIA_FILE_STORE = "files";
const MEDIA_CHUNK_STORE = "fileChunks";
const MEDIA_DEFAULT_CHUNK_BYTES = 1024 * 1024;
const MEDIA_RESPONSE_CHUNK_BYTES = 4 * 1024 * 1024;
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./backup.js",
  "./reader.js",
  "./range-zip-reader.js",
  "./pwa.js",
  "./pwa.webmanifest",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png",
  "./lib/jszip.min.js",
  "./lib/pako.min.js",
  "./lib/7zz.umd.js",
  "./lib/7zz.wasm",
  "./lib/page-flip.browser.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

let mediaDbPromise = null;

function openMediaDB() {
  if (mediaDbPromise) return mediaDbPromise;
  mediaDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(MEDIA_DB_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Media database open failed"));
    request.onupgradeneeded = () => {
      request.transaction?.abort();
      reject(new Error("Media database is not initialized"));
    };
  }).catch(error => {
    mediaDbPromise = null;
    throw error;
  });
  return mediaDbPromise;
}

async function mediaGetFile(fileId) {
  const database = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(MEDIA_FILE_STORE, "readonly");
    const request = tx.objectStore(MEDIA_FILE_STORE).get(fileId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("Media file lookup failed"));
  });
}

async function mediaGetChunkBatch(fileId, firstIndex, lastIndex) {
  const database = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(MEDIA_CHUNK_STORE, "readonly");
    const store = tx.objectStore(MEDIA_CHUNK_STORE);
    const records = new Array(lastIndex - firstIndex + 1);
    let failed = false;
    for (let index = firstIndex; index <= lastIndex; index++) {
      const request = store.get(`${fileId}:${index}`);
      request.onsuccess = () => { records[index - firstIndex] = request.result || null; };
      request.onerror = () => {
        failed = true;
        reject(request.error || new Error("Media chunk read failed"));
      };
    }
    tx.oncomplete = () => { if (!failed) resolve(records); };
    tx.onerror = () => { if (!failed) reject(tx.error || new Error("Media chunk transaction failed")); };
    tx.onabort = () => { if (!failed) reject(tx.error || new Error("Media chunk transaction aborted")); };
  });
}

async function mediaDataBytes(data) {
  if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  throw new Error("Invalid media data");
}

async function mediaReadRange(file, start, endExclusive) {
  const length = Math.max(0, endExclusive - start);
  if (!length) return new Uint8Array(0);
  if (!file.isChunked) {
    const source = file.data instanceof Blob ? file.data : new Blob([file.data || new Uint8Array(0)]);
    return new Uint8Array(await source.slice(start, endExclusive).arrayBuffer());
  }

  const chunkSize = Number(file.chunkSize || MEDIA_DEFAULT_CHUNK_BYTES);
  const firstIndex = Math.floor(start / chunkSize);
  const lastIndex = Math.floor((endExclusive - 1) / chunkSize);
  const records = await mediaGetChunkBatch(file.id, firstIndex, lastIndex);
  const output = new Uint8Array(length);
  let written = 0;

  for (let index = firstIndex; index <= lastIndex; index++) {
    const record = records[index - firstIndex];
    if (!record?.data) throw new Error(`Media chunk missing: ${index}`);
    const bytes = await mediaDataBytes(record.data);
    const chunkStart = index * chunkSize;
    const from = Math.max(0, start - chunkStart);
    const to = Math.min(bytes.length, endExclusive - chunkStart);
    if (to <= from) throw new Error(`Media chunk incomplete: ${index}`);
    output.set(bytes.subarray(from, to), written);
    written += to - from;
  }

  if (written !== output.length) throw new Error("Media range is incomplete");
  return output;
}

function parseMediaRange(header, size) {
  if (!header) return null;
  if (!/^bytes=/i.test(header) || header.includes(",")) return { invalid: true };
  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match || (!match[1] && !match[2]) || size <= 0) return { invalid: true };

  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return { invalid: true };
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return { invalid: true };
  }

  if (start < 0 || start >= size || end < start) return { invalid: true };
  return { start, end: Math.min(end, size - 1) };
}

function mediaMimeFromName(name) {
  const ext = String(name || "").split(".").pop().toLowerCase();
  const types = {
    mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime",
    webm: "video/webm", ogv: "video/ogg", ogg: "video/ogg",
    mkv: "video/x-matroska", avi: "video/x-msvideo",
    "3gp": "video/3gpp", "3g2": "video/3gpp2",
    mpg: "video/mpeg", mpeg: "video/mpeg", ts: "video/mp2t", m2ts: "video/mp2t"
  };
  return types[ext] || "application/octet-stream";
}

function mediaCreateStream(file, start, endExclusive) {
  let cursor = start;
  return new ReadableStream({
    async pull(controller) {
      if (cursor >= endExclusive) {
        controller.close();
        return;
      }
      const next = Math.min(endExclusive, cursor + MEDIA_RESPONSE_CHUNK_BYTES);
      try {
        const bytes = await mediaReadRange(file, cursor, next);
        cursor = next;
        controller.enqueue(bytes);
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

async function handleMediaRequest(request, url) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }
  const fileId = Number(url.searchParams.get("id"));
  if (!Number.isSafeInteger(fileId) || fileId <= 0) return new Response("Invalid file id", { status: 400 });

  try {
    const file = await mediaGetFile(fileId);
    if (!file) return new Response("File not found", { status: 404 });
    if (file.isPrivate) return new Response("Private media requires app decryption", { status: 403 });
    const size = Number(file.size || file.data?.size || file.data?.byteLength || 0);
    if (!Number.isSafeInteger(size) || size < 0) return new Response("Invalid media size", { status: 500 });
    const requestedMime = url.searchParams.get("mime") || "";
    const type = requestedMime.startsWith("video/")
      ? requestedMime
      : (String(file.type || "").startsWith("video/") ? file.type : mediaMimeFromName(file.name));
    const range = parseMediaRange(request.headers.get("Range"), size);
    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
      "Content-Type": type
    });

    if (range?.invalid) {
      headers.set("Content-Range", `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }

    const start = range ? range.start : 0;
    const end = range ? range.end : Math.max(0, size - 1);
    const responseLength = size ? end - start + 1 : 0;
    headers.set("Content-Length", String(responseLength));
    if (range) headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    const body = request.method === "HEAD" || responseLength === 0
      ? null
      : mediaCreateStream(file, start, end + 1);
    return new Response(body, { status: range ? 206 : 200, headers });
  } catch (error) {
    console.error("[media-route]", error);
    return new Response("Stored media read failed", { status: 500 });
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith(MEDIA_ROUTE)) {
    event.respondWith(handleMediaRequest(request, url));
    return;
  }

  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  const isAppCode = /\.(?:css|js|webmanifest)$/i.test(url.pathname);
  if (isAppCode) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
