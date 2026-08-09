const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function extractFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Function not found: ${name}`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index++) {
    if (source[index] === "{") depth++;
    if (source[index] === "}") {
      depth--;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Function body is incomplete: ${name}`);
}

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const workerSource = fs.readFileSync(path.join(__dirname, "..", "service-worker.js"), "utf8");
const context = vm.createContext({ Uint8Array });

vm.runInContext([
  extractFunction(appSource, "getFileExt"),
  extractFunction(appSource, "isVideoFileName"),
  extractFunction(appSource, "getFileCat"),
  extractFunction(appSource, "detectMagicFormat"),
  extractFunction(appSource, "isVideoFormat"),
  extractFunction(appSource, "getIconClass"),
  extractFunction(appSource, "getVideoMimeType"),
  extractFunction(appSource, "formatVideoTime"),
  extractFunction(workerSource, "parseMediaRange"),
  extractFunction(workerSource, "mediaMimeFromName")
].join("\n"), context);

assert.strictEqual(vm.runInContext('getFileCat("movie.mp4")', context), "video");
assert.strictEqual(vm.runInContext('getFileCat("camera.MOV")', context), "video");
assert.strictEqual(vm.runInContext('getFileCat("episode.mkv")', context), "video");
assert.strictEqual(vm.runInContext('getIconClass("movie.webm")', context), "video");
assert.strictEqual(vm.runInContext('getVideoMimeType({ name: "movie.mov", type: "" })', context), "video/quicktime");
assert.strictEqual(vm.runInContext("formatVideoTime(65.9)", context), "01:05");
assert.strictEqual(vm.runInContext("formatVideoTime(3661)", context), "1:01:01");

const mp4 = new Uint8Array(12);
mp4.set([0x66, 0x74, 0x79, 0x70], 4);
context.sample = mp4;
assert.strictEqual(vm.runInContext("detectMagicFormat(sample)", context), "mp4");

context.sample = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]);
assert.strictEqual(vm.runInContext("detectMagicFormat(sample)", context), "webm");

const avi = new Uint8Array(12);
avi.set([0x52, 0x49, 0x46, 0x46], 0);
avi.set([0x41, 0x56, 0x49, 0x20], 8);
context.sample = avi;
assert.strictEqual(vm.runInContext("detectMagicFormat(sample)", context), "avi");

assert.deepStrictEqual(
  JSON.parse(vm.runInContext('JSON.stringify(parseMediaRange("bytes=100-199", 1000))', context)),
  { start: 100, end: 199 }
);
assert.deepStrictEqual(
  JSON.parse(vm.runInContext('JSON.stringify(parseMediaRange("bytes=900-", 1000))', context)),
  { start: 900, end: 999 }
);
assert.deepStrictEqual(
  JSON.parse(vm.runInContext('JSON.stringify(parseMediaRange("bytes=-100", 1000))', context)),
  { start: 900, end: 999 }
);
assert.strictEqual(vm.runInContext('parseMediaRange("bytes=1000-1001", 1000).invalid', context), true);
assert.strictEqual(vm.runInContext('mediaMimeFromName("clip.webm")', context), "video/webm");

assert.match(appSource, /video\.playbackRate = 3;/, "long press should switch playback to 3x");
assert.match(appSource, /}, 350\);/, "long press should use the intended hold threshold");
assert.match(appSource, /pm_video_brightness/, "brightness preference should be persisted");
assert.match(appSource, /pm_video_volume/, "volume preference should be persisted");

console.log("video support tests passed");
