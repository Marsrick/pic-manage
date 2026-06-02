/* ===== COMIC READER STATE ===== */
let readerPages = [];
let readerName = "";
let rPageIdx = 0;
let rMode = "click"; // click | flip | slide | webtoon
let rAutoPlaying = false;
let rAutoTimer = null;
let rAutoSpeed = 3;
let isFlipping = false;
let pageFlipInstance = null;
let readerImageZoomed = false;

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
      const fileData = uint8.subarray(offset, offset + size);
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
  const instance = await SevenZip({
    locateFile: (path) => {
      if (path.endsWith('.wasm')) return 'lib/7zz.wasm';
      return 'lib/' + path;
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
      } else {
        const entryExt = entry.name.split(".").pop().toLowerCase();
        if (["png","jpg","jpeg","gif","webp","svg","bmp"].includes(entryExt)) {
          images.push({ name: entry.name, data: new Blob([entryBuf]) });
        }
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
    const innerType = detectMagicType(uint8Data.buffer);
    if (innerType === "tar" || name.toLowerCase().endsWith(".tar") || name.toLowerCase().endsWith(".tgz")) {
      const tarFiles = parseTar(uint8Data.buffer);
      for (const file of tarFiles) {
        if (isArchiveData(file.name, file.data.buffer)) {
          const sub = await extractAllImagesRecursive(file.name, file.data.buffer);
          images.push(...sub);
        } else {
          const fileExt = file.name.split(".").pop().toLowerCase();
          if (["png","jpg","jpeg","gif","webp","svg","bmp"].includes(fileExt)) {
            images.push({ name: file.name, data: new Blob([file.data]) });
          }
        }
      }
    } else {
      const cleanName = name.replace(/\.gz$/i, "");
      const fileExt = cleanName.split(".").pop().toLowerCase();
      if (["png","jpg","jpeg","gif","webp","svg","bmp"].includes(fileExt)) {
        images.push({ name: cleanName, data: new Blob([uint8Data.buffer]) });
      }
    }
  } else if (format === "7z") {
    const files = await extract7z(arrayBuffer);
    for (const file of files) {
      if (isArchiveData(file.name, file.data.buffer)) {
        const sub = await extractAllImagesRecursive(file.name, file.data.buffer);
        images.push(...sub);
      } else {
        const fileExt = file.name.split(".").pop().toLowerCase();
        if (["png","jpg","jpeg","gif","webp","svg","bmp"].includes(fileExt)) {
          images.push({ name: file.name, data: new Blob([file.data]) });
        }
      }
    }
  }

  return images;
}

/* ===== OPEN READER ===== */
async function openComicReader(zipBlob, name) {
  const overlay = document.getElementById("readerOverlay");
  const canvas = document.getElementById("readerCanvas");
  overlay.classList.add("active");
  readerName = name;
  rPageIdx = 0;
  initReaderGestures();
  document.getElementById("readerFileName").textContent = name;
  document.getElementById("readerPageIndicator").textContent = "...";

  canvas.innerHTML = `<div class="empty-placeholder" style="border:none"><svg class="spinner" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg><p>${t("parsingZip")}</p></div>`;

  try {
    const arrayBuffer = await zipBlob.arrayBuffer();
    const images = await extractAllImagesRecursive(name, arrayBuffer);

    // Natural Alphanumeric Sort
    images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

    if (images.length === 0) {
      canvas.innerHTML = `<div class="empty-placeholder" style="border:none"><p>${t("parseErr")}</p></div>`;
      return;
    }

    readerPages = [];
    for (const img of images) {
      readerPages.push(URL.createObjectURL(img.data));
    }

    initReaderUI();
    renderPage();
    toast(`${readerPages.length} ${t("parseOk")}`, "success");
  } catch (e) {
    console.error(e);
    canvas.innerHTML = `<div class="empty-placeholder" style="border:none"><p>${t("parseErr")}</p></div>`;
  }
}

/* ===== CLOSE READER ===== */
function closeReader() {
  stopAuto();
  destroyPageFlip();
  cancelAnimationFrame(pfRAF);
  readerPages.forEach(u => URL.revokeObjectURL(u));
  readerPages = [];
  document.getElementById("readerOverlay").classList.remove("active");
  document.getElementById("readerCanvas").innerHTML = "";
  document.getElementById("readerControls").classList.remove("visible");
  closeSidebar();
}

/* ===== READER UI INIT ===== */
function initReaderUI() {
  const modeSel = document.getElementById("rModeSelect");
  const speedSlider = document.getElementById("rSpeedSlider");

  modeSel.value = rMode;
  speedSlider.value = rAutoSpeed;
  document.getElementById("rSpeedVal").textContent = rAutoSpeed;

  modeSel.onchange = () => { rMode = modeSel.value; stopAuto(); renderPage(); };
  speedSlider.oninput = () => { rAutoSpeed = parseInt(speedSlider.value); document.getElementById("rSpeedVal").textContent = rAutoSpeed; if (rAutoPlaying) { stopAuto(); startAuto(); } };

  // Build the page-fan progress selector
  buildPageFan();

  updateProgress();
}

function updateProgress() {
  document.getElementById("readerPageIndicator").textContent = `${String(rPageIdx+1).padStart(2,"0")}/${readerPages.length}`;

  // Keep the page fan in sync (unless the user is actively dragging it)
  if (!pfDragging) { pfPos = rPageIdx; layoutPageFan(); }

  // Preload adjacent pages
  preloadAdjacent();
}

function preloadAdjacent() {
  const range = 2; // Preload next 2 pages and previous 1 page
  for (let i = 1; i <= range; i++) {
    const next = rPageIdx + i;
    if (next < readerPages.length) {
      const img = new Image();
      img.src = readerPages[next];
    }
  }
  const prev = rPageIdx - 1;
  if (prev >= 0) {
    const img = new Image();
    img.src = readerPages[prev];
  }
}

/* ===== RENDER PAGE ===== */
function renderPage() {
  const container = document.getElementById("readerCanvas");
  destroyPageFlip();
  container.innerHTML = "";

  if (rMode === "click") {
    readerImageZoomed = false;
    const wrap = document.createElement("div"); wrap.className = "reader-page-wrap";
    const box = document.createElement("div"); box.className = "r-page-img-box";
    const img = document.createElement("img"); img.src = readerPages[rPageIdx]; img.alt = `Page ${rPageIdx+1}`;

    const tapL = document.createElement("div"); tapL.className = "r-tap-zone r-tap-left";
    tapL.onclick = e => { e.stopPropagation(); if (!readerImageZoomed) flipPage(-1); };
    const tapR = document.createElement("div"); tapR.className = "r-tap-zone r-tap-right";
    tapR.onclick = e => { e.stopPropagation(); if (!readerImageZoomed) flipPage(1); };

    box.onclick = () => { if (!readerImageZoomed) toggleControls(); };
    box.appendChild(img); box.appendChild(tapL); box.appendChild(tapR);
    wrap.appendChild(box); container.appendChild(wrap);

    if (typeof enableImageZoom === "function") {
      enableImageZoom(img, box, (z) => { readerImageZoomed = z; }, { doubleTap: false });
    }
  } else if (rMode === "slide") {
    const wrap = document.createElement("div"); wrap.className = "r-h-scroll"; wrap.id = "hScroll";
    readerPages.forEach((src, i) => {
      const pg = document.createElement("div"); pg.className = "r-h-page";
      const img = document.createElement("img"); img.src = src;
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
    readerPages.forEach((src, i) => {
      const pg = document.createElement("div"); pg.className = "r-v-page"; pg.id = `vp-${i}`;
      const img = document.createElement("img"); img.src = src;
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
    // StPageFlip owns touch (drag/curl) directly — no wrapping transform layer,
    // which previously corrupted its clip-path/curl math. Taps are handled via
    // the click event, which does NOT fire during a drag, so it can't interfere.
    const host = document.createElement("div"); host.className = "flip-host"; host.id = "flipHost";
    container.appendChild(host);
    host.addEventListener("click", (e) => {
      const r = host.getBoundingClientRect();
      const x = e.clientX - r.left;
      if (x < r.width * 0.3) flipPrevPage();
      else if (x > r.width * 0.7) flipNextPage();
      else toggleControls();
    });
    setTimeout(() => initPageFlip(host), 40);
  }
}

/* ===== PAGE CURL (StPageFlip) — locked to single page ===== */
function initPageFlip(host) {
  if (typeof St === "undefined" || !St.PageFlip) {
    console.warn("[reader] StPageFlip not loaded, falling back to click mode");
    rMode = "click";
    const sel = document.getElementById("rModeSelect"); if (sel) sel.value = "click";
    renderPage();
    return;
  }
  // Size each page to fill the reading area; images use object-fit:contain
  // inside, so any aspect ratio fills the screen by its longest side
  // without being stretched.
  const w = Math.max(200, Math.floor(host.clientWidth));
  const h = Math.max(200, Math.floor(host.clientHeight));
  buildPageFlip(host, w, h);
}

function buildPageFlip(host, pageW, pageH) {
  if (rMode !== "flip") return;
  destroyPageFlip();

  pageFlipInstance = new St.PageFlip(host, {
    width: pageW,
    height: pageH,
    size: "stretch",
    minWidth: 150, maxWidth: 3000,
    minHeight: 200, maxHeight: 3000,
    maxShadowOpacity: 0.4,
    showCover: false,
    usePortrait: true,          // forced single page (lib patched to ignore width)
    mobileScrollSupport: false,
    drawShadow: true,
    flippingTime: 420,          // snappier turn
    swipeDistance: 18,          // more sensitive swipe
    disableFlipByClick: true,   // taps handled by our click-zone logic
    showPageCorners: true,      // live corner-peek while dragging
    useMouseEvents: true,
  });

  const pageEls = readerPages.map((src, i) => {
    const div = document.createElement("div");
    div.className = "flip-page-content";
    const img = document.createElement("img");
    img.src = src;
    img.alt = `Page ${i + 1}`;
    div.appendChild(img);
    return div;
  });
  pageFlipInstance.loadFromHTML(pageEls);

  if (rPageIdx > 0) {
    try { pageFlipInstance.turnToPage(rPageIdx); } catch (e) {}
  }

  pageFlipInstance.on("flip", (e) => {
    if (typeof e.data === "number") { rPageIdx = e.data; updateProgress(); }
  });
}

function flipNextPage() {
  if (pageFlipInstance) { try { pageFlipInstance.flipNext(); } catch (e) {} }
}
function flipPrevPage() {
  if (pageFlipInstance) { try { pageFlipInstance.flipPrev(); } catch (e) {} }
}

function destroyPageFlip() {
  if (pageFlipInstance) {
    try { pageFlipInstance.destroy(); } catch (e) {}
    pageFlipInstance = null;
  }
  readerImageZoomed = false;
}

/* ===== SWIPE GESTURES ===== */
let readerGesturesBound = false;
function initReaderGestures() {
  if (readerGesturesBound) return;
  readerGesturesBound = true;
  const canvas = document.getElementById("readerCanvas");
  if (!canvas) return;
  let sx = 0, sy = 0, st = 0, tracking = false;

  canvas.addEventListener("touchstart", (e) => {
    // Flip mode is handled by StPageFlip's own drag/curl; only click mode uses our swipe.
    // Skip when the page is zoomed (drag should pan the image instead of flipping).
    if (rMode !== "click" || readerImageZoomed || e.touches.length > 1) { tracking = false; return; }
    const tch = e.touches[0];
    sx = tch.clientX; sy = tch.clientY; st = Date.now(); tracking = true;
  }, { passive: true });

  canvas.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;
    const tch = e.changedTouches[0];
    const dx = tch.clientX - sx;
    const dy = tch.clientY - sy;
    const dt = Date.now() - st;
    // Horizontal swipe: distance + mostly-horizontal + quick enough
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 700) {
      if (dx < 0) flipPage(1);   // swipe left  -> next page
      else flipPage(-1);          // swipe right -> previous page
    }
  }, { passive: true });
}

/* ===== PAGE NAVIGATION ===== */
function flipPage(dir) {
  if (rMode === "flip") {
    if (!pageFlipInstance) return;
    if (dir === 1) {
      if (rPageIdx >= readerPages.length - 1) { stopAuto(); toast(t("readerEnd"), "info"); return; }
      pageFlipInstance.flipNext();
    } else {
      pageFlipInstance.flipPrev();
    }
    return;
  }
  const next = rPageIdx + dir;
  if (next < 0 || next >= readerPages.length) {
    if (next >= readerPages.length) { stopAuto(); toast(t("readerEnd"), "info"); }
    return;
  }
  rPageIdx = next; updateProgress();
  if (rMode === "click") {
    const img = document.querySelector(".r-page-img-box img");
    if (img) { if (img._resetZoom) img._resetZoom(); readerImageZoomed = false; img.src = readerPages[rPageIdx]; }
  } else if (rMode === "slide") {
    const wrap = document.getElementById("hScroll");
    if (wrap) wrap.scrollLeft = rPageIdx * wrap.clientWidth;
  }
}

function jumpPage(idx) {
  rPageIdx = idx; updateProgress();
  if (rMode === "click") {
    const img = document.querySelector(".r-page-img-box img");
    if (img) img.src = readerPages[rPageIdx];
  } else if (rMode === "flip") {
    if (pageFlipInstance) { try { pageFlipInstance.turnToPage(idx); } catch (e) {} }
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
      img.src = readerPages[i];
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
      s.querySelector("img").src = readerPages[idx];
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
    if (img) { if (img._resetZoom) img._resetZoom(); img.src = readerPages[idx]; }
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
