const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { webcrypto } = require("crypto");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function makeStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

function makeElement() {
  const classes = new Set();
  return {
    value: "",
    textContent: "",
    style: {},
    classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      toggle: (value, force) => force ? classes.add(value) : classes.delete(value),
      contains: value => classes.has(value)
    },
    addEventListener() {},
    querySelectorAll: () => [],
    _classes: classes
  };
}

function makeContext() {
  const elements = new Map();
  const document = {
    addEventListener() {},
    querySelectorAll: () => [],
    querySelector: () => null,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement());
      return elements.get(id);
    },
    body: makeElement(),
    visibilityState: "visible"
  };
  const context = vm.createContext({
    console,
    Blob,
    ArrayBuffer,
    Uint8Array,
    DataView,
    TextEncoder,
    TextDecoder,
    URL,
    crypto: webcrypto,
    document,
    window: { addEventListener() {} },
    navigator: {
      storage: {
        persisted: async () => false,
        persist: async () => true,
        estimate: async () => ({ usage: 0, quota: 2 * 1024 * 1024 * 1024 })
      }
    },
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    indexedDB: {},
    IDBKeyRange: { bound() {}, only() {} },
    setTimeout,
    clearTimeout,
    requestAnimationFrame: callback => callback(),
    requestIdleCallback: callback => callback(),
    confirm: () => true,
    fetch: async () => { throw new Error("not available in unit test"); },
    atob: value => Buffer.from(value, "base64").toString("binary"),
    btoa: value => Buffer.from(value, "binary").toString("base64")
  });
  context.globalThis = context;
  context.__elements = elements;
  vm.runInContext(appSource, context, { filename: "app.js" });
  return context;
}

async function testOver500MbSelectionIsAccepted(context) {
  context.__hugeFile = {
    name: "over-500mb.zip",
    size: 600 * 1024 * 1024,
    type: "application/zip",
    slice() { return new Blob(); }
  };
  await vm.runInContext("isAdmin = true; prepUpload([__hugeFile])", context);
  const pendingSize = vm.runInContext("pendingFiles[0]?.size", context);
  assert.strictEqual(pendingSize, 600 * 1024 * 1024, "files over 500MB must not be filtered out");
  assert(context.__elements.get("choiceDialog")._classes.has("active"), "storage choice should open for the large file");
}

async function testPrivateStreamingRoundTrip(context) {
  const length = 18 * 1024 * 1024 + 321;
  const source = new Uint8Array(length);
  for (let index = 0; index < source.length; index++) source[index] = (index * 31 + 17) & 0xff;
  context.__sourceBlob = new Blob([source]);

  vm.runInContext(`
    globalThis.__writtenChunks = [];
    globalThis.__capturedMeta = null;
    dbAddRaw = async meta => { globalThis.__capturedMeta = meta; return 77; };
    dbDel = async () => {};
    dbPutChunkBatch = async (fileId, firstIndex, parts) => {
      if (fileId !== 77) throw new Error("unexpected file id");
      for (let offset = 0; offset < parts.length; offset++) {
        const part = parts[offset];
        let bytes;
        if (part instanceof Blob) bytes = new Uint8Array(await part.arrayBuffer());
        else if (part instanceof ArrayBuffer) bytes = new Uint8Array(part);
        else bytes = new Uint8Array(part.buffer, part.byteOffset, part.byteLength);
        globalThis.__writtenChunks[firstIndex + offset] = bytes.slice();
      }
    };
  `, context);

  const result = await vm.runInContext(`(async () => {
    const id = await dbAddPrivateChunked(
      { name: "private.bin", size: __sourceBlob.size, type: "application/octet-stream", isPrivate: true },
      __sourceBlob,
      "1-2-3-6"
    );
    const encrypted = new Blob(globalThis.__writtenChunks);
    const decrypted = await decryptBlob(encrypted, "1-2-3-6", "application/octet-stream");
    return {
      id,
      bytes: new Uint8Array(await decrypted.arrayBuffer()),
      chunkCount: globalThis.__writtenChunks.length,
      metaChunkCount: globalThis.__capturedMeta.chunkCount,
      isChunked: globalThis.__capturedMeta.isChunked
    };
  })()`, context);

  assert.strictEqual(result.id, 77);
  assert.strictEqual(result.isChunked, true);
  assert.strictEqual(result.chunkCount, result.metaChunkCount, "stored chunk metadata must match the written chunks");
  assert.strictEqual(result.bytes.length, source.length);
  assert(Buffer.from(result.bytes).equals(Buffer.from(source)), "streamed private import must decrypt to the original bytes");
}

async function testPublicWritesAreBatched(context) {
  context.__publicBlob = new Blob([new Uint8Array(10 * 1024 * 1024 + 123)]);
  const batches = await vm.runInContext(`(async () => {
    const calls = [];
    dbPutChunkBatch = async (fileId, firstIndex, parts) => calls.push({ fileId, firstIndex, length: parts.length });
    await dbWriteBlobChunks(9, __publicBlob);
    return calls;
  })()`, context);
  assert.deepStrictEqual(
    Array.from(batches, item => ({ fileId: item.fileId, firstIndex: item.firstIndex, length: item.length })),
    [
      { fileId: 9, firstIndex: 0, length: 8 },
      { fileId: 9, firstIndex: 8, length: 3 }
    ]
  );
}

async function testRangeReadUsesEmbeddedHistoricalData(context) {
  context.__historicalBlob = new Blob([new Uint8Array([10, 20, 30, 40, 50, 60])]);
  const bytes = await vm.runInContext(`(async () => {
    const originalBatch = dbGetChunkBatch;
    dbGetChunkBatch = async () => { throw new Error("chunk lookup must not run"); };
    try {
      return await dbReadStoredRange({
        id: 91,
        size: 6,
        data: __historicalBlob,
        isChunked: true,
        chunkSize: IDB_CHUNK_BYTES,
        chunkCount: 99
      }, 1, 5);
    } finally {
      dbGetChunkBatch = originalBatch;
    }
  })()`, context);
  assert.deepStrictEqual(Array.from(bytes), [20, 30, 40, 50], "embedded historical data must win over stale chunk metadata");
}

async function testRangeReadRepairsHistoricalChunkSize(context) {
  const bytes = await vm.runInContext(`(async () => {
    const originalGet = dbGetChunk;
    const originalBatch = dbGetChunkBatch;
    const chunks = [
      { data: new Uint8Array([1, 2, 3, 4]).buffer },
      { data: new Uint8Array([5, 6, 7, 8]).buffer }
    ];
    dbGetChunk = async (_fileId, index) => chunks[index] || null;
    dbGetChunkBatch = async (_fileId, first, last) => chunks.slice(first, last + 1);
    resolvedChunkSizeCache.clear();
    try {
      return await dbReadStoredRange({ id: 92, size: 8, isChunked: true, chunkSize: 2, chunkCount: 2 }, 0, 8);
    } finally {
      dbGetChunk = originalGet;
      dbGetChunkBatch = originalBatch;
      resolvedChunkSizeCache.clear();
    }
  })()`, context);
  assert.deepStrictEqual(Array.from(bytes), [1, 2, 3, 4, 5, 6, 7, 8], "range reads must use the observed historical chunk size");
}

(async () => {
  const context = makeContext();
  await testOver500MbSelectionIsAccepted(context);
  await testPrivateStreamingRoundTrip(context);
  await testPublicWritesAreBatched(context);
  await testRangeReadUsesEmbeddedHistoricalData(context);
  await testRangeReadRepairsHistoricalChunkSize(context);
  console.log("large-import tests passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
