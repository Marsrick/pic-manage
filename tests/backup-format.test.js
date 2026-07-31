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
}

(async () => {
  await testPlainZipRoundTrip();
  await testEncryptedRoundTrip();
  console.log("Backup format tests passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
