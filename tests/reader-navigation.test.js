const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const listeners = {};
let releases = 0;
let requests = 0;
let resolveLock;
const lock = { release: async () => { releases++; }, addEventListener() {} };
const context = vm.createContext({
  console, URL, Blob, Map, Set, performance,
  document: { getElementById: () => null, addEventListener: (name, fn) => { listeners[name] = fn; }, visibilityState: 'visible' },
  navigator: { wakeLock: { request: async () => { requests++; return lock; } } },
  dbAll: async () => [
    { id: 10, name: '10.cbz', folder: 'book' },
    { id: 1, name: '1.cbz', folder: 'book' },
    { id: 2, name: '2.cbz', folder: 'book' },
    { id: 3, name: '3.cbz', folder: 'other' },
    { id: 4, name: '4.cbz', folder: 'book', isPrivate: true },
    { id: 5, name: '5.txt', folder: 'book' }
  ],
  isAdmin: false, isFileVisibleInPublicMode: f => !f.isPrivate,
  probeStoredFileFormat: async f => ({ fmt: f.name.endsWith('.dat') ? 'zip' : 'unknown' }),
  isArchiveFormat: fmt => fmt === 'zip',
  toast() {}, t: key => key
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../reader.js'), 'utf8'), context);
const run = code => vm.runInContext(code, context);

(async () => {
  run('readerFile = { id: 1, folder: "book" }');
  assert.equal((await run('getNextReaderChapter()')).id, 2);
  run('readerFile.id = 2');
  assert.equal((await run('getNextReaderChapter()')).id, 10);
  run('readerFile.id = 10');
  assert.equal(await run('getNextReaderChapter()'), null);

  const originalDbAll = context.dbAll;
  context.dbAll = async () => [
    { id: 1, name: '01.dat', folder: 'book' },
    { id: 2, name: '02.txt', folder: 'book' },
    { id: 3, name: '03.dat', folder: 'book' }
  ];
  context.isAdmin = true;
  run('readerFile = { id: "1", folder: "book" }');
  assert.equal((await run('getNextReaderChapter()')).id, 3);
  context.isAdmin = false;
  context.dbAll = originalDbAll;
  run('readerFile.id = 99');
  assert.equal(await run('getNextReaderChapter()'), null);

  run('rAutoPlaying = true');
  await run('acquireReaderWakeLock()');
  await run('acquireReaderWakeLock()');
  assert.equal(requests, 1);
  run('cancelAutoCycle = () => {}; syncAutoPlayUI = () => {}; stopAuto()');
  assert.equal(releases, 1);

  context.navigator.wakeLock.request = () => new Promise(resolve => { resolveLock = resolve; });
  run('rAutoPlaying = true');
  const pending = run('acquireReaderWakeLock()');
  run('stopAuto()');
  resolveLock(lock);
  await pending;
  assert.equal(releases, 2);
  assert.equal(run('readerWakeLock'), null);

  let opened = 0;
  context.openFileView = async () => { opened++; run('readerOpenSeq++; readerPages = ["page"]'); };
  run('readerFile.id = 1');
  await Promise.all([run('nextReaderChapter()'), run('nextReaderChapter()')]);
  assert.equal(opened, 1);
  const cancelled = run('nextReaderChapter()');
  run('readerOpenSeq++');
  await cancelled;
  assert.equal(opened, 1);
  console.log('Reader navigation and wake lock tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
