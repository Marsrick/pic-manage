/* ===== COMIC READER STATE ===== */
let readerPages = [];
let readerName = "";
let rPageIdx = 0;
let rMode = "click"; // click | flip | slide | webtoon
let rAutoPlaying = false;
let rAutoTimer = null;
let rAutoSpeed = 3;
let isFlipping = false;

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

async function extractAllImagesRecursive(name, arrayBuffer) {
  const ext = name.split(".").pop().toLowerCase();
  let images = [];

  if (ext === "zip" || ext === "cbz") {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const entries = [];
    zip.forEach((relPath, entry) => {
      if (entry.dir || relPath.startsWith("__MACOSX") || relPath.startsWith(".")) return;
      entries.push(entry);
    });

    for (const entry of entries) {
      const entryBuf = await entry.async("arraybuffer");
      if (isArchive(entry.name)) {
        const sub = await extractAllImagesRecursive(entry.name, entryBuf);
        images.push(...sub);
      } else {
        const entryExt = entry.name.split(".").pop().toLowerCase();
        if (["png","jpg","jpeg","gif","webp","svg","bmp"].includes(entryExt)) {
          images.push({ name: entry.name, data: new Blob([entryBuf]) });
        }
      }
    }
  } else if (ext === "tar" || ext === "gz" || ext === "tgz") {
    let uint8 = new Uint8Array(arrayBuffer);
    if ((uint8[0] === 0x1f && uint8[1] === 0x8b) || ext === "gz" || ext === "tgz") {
      try {
        uint8 = pako.ungzip(uint8);
      } catch (e) {
        console.error("pako ungzip failed", e);
      }
    }
    const tarFiles = parseTar(uint8.buffer);
    for (const file of tarFiles) {
      if (isArchive(file.name)) {
        const sub = await extractAllImagesRecursive(file.name, file.data.buffer);
        images.push(...sub);
      } else {
        const fileExt = file.name.split(".").pop().toLowerCase();
        if (["png","jpg","jpeg","gif","webp","svg","bmp"].includes(fileExt)) {
          images.push({ name: file.name, data: new Blob([file.data]) });
        }
      }
    }
  } else if (ext === "7z") {
    const files = await extract7z(arrayBuffer);
    for (const file of files) {
      if (isArchive(file.name)) {
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
  readerPages.forEach(u => URL.revokeObjectURL(u));
  readerPages = [];
  document.getElementById("readerOverlay").classList.remove("active");
  document.getElementById("readerCanvas").innerHTML = "";
  document.getElementById("readerControls").classList.remove("visible");
  document.getElementById("readerSidebar").classList.remove("active");
}

/* ===== READER UI INIT ===== */
function initReaderUI() {
  const slider = document.getElementById("rPageSlider");
  const sel = document.getElementById("rPageSelect");
  const modeSel = document.getElementById("rModeSelect");
  const speedSlider = document.getElementById("rSpeedSlider");

  slider.min = 1; slider.max = readerPages.length; slider.value = 1;
  sel.innerHTML = "";
  for (let i = 0; i < readerPages.length; i++) {
    const o = document.createElement("option"); o.value = i; o.textContent = `${i+1}/${readerPages.length}`; sel.appendChild(o);
  }

  modeSel.value = rMode;
  speedSlider.value = rAutoSpeed;
  document.getElementById("rSpeedVal").textContent = rAutoSpeed;

  slider.oninput = () => { rPageIdx = parseInt(slider.value) - 1; sel.value = rPageIdx; jumpPage(rPageIdx); };
  sel.onchange = () => { rPageIdx = parseInt(sel.value); slider.value = rPageIdx + 1; jumpPage(rPageIdx); };
  modeSel.onchange = () => { rMode = modeSel.value; stopAuto(); renderPage(); };
  speedSlider.oninput = () => { rAutoSpeed = parseInt(speedSlider.value); document.getElementById("rSpeedVal").textContent = rAutoSpeed; if (rAutoPlaying) { stopAuto(); startAuto(); } };

  // Build sidebar chapter list
  const list = document.getElementById("sidebarList");
  list.innerHTML = "";
  for (let i = 0; i < readerPages.length; i++) {
    const item = document.createElement("div");
    item.className = `sidebar-item${i === 0 ? " active" : ""}`;
    item.dataset.idx = i;
    item.innerHTML = `<span class="pg-num">${String(i+1).padStart(2,"0")}</span><span>Page ${i+1}</span>`;
    item.onclick = () => { rPageIdx = i; updateProgress(); jumpPage(i); toggleSidebar(); };
    list.appendChild(item);
  }

  updateProgress();
}

function updateProgress() {
  document.getElementById("rPageSlider").value = rPageIdx + 1;
  document.getElementById("rPageSelect").value = rPageIdx;
  document.getElementById("readerPageIndicator").textContent = `${String(rPageIdx+1).padStart(2,"0")}/${readerPages.length}`;

  // Update sidebar active
  document.querySelectorAll(".sidebar-item").forEach(item => {
    item.classList.toggle("active", parseInt(item.dataset.idx) === rPageIdx);
  });

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
  container.innerHTML = "";

  if (rMode === "click") {
    const wrap = document.createElement("div"); wrap.className = "reader-page-wrap";
    const box = document.createElement("div"); box.className = "r-page-img-box";
    const img = document.createElement("img"); img.src = readerPages[rPageIdx]; img.alt = `Page ${rPageIdx+1}`;

    const tapL = document.createElement("div"); tapL.className = "r-tap-zone r-tap-left";
    tapL.onclick = e => { e.stopPropagation(); flipPage(-1); };
    const tapR = document.createElement("div"); tapR.className = "r-tap-zone r-tap-right";
    tapR.onclick = e => { e.stopPropagation(); flipPage(1); };

    box.onclick = () => toggleControls();
    box.appendChild(img); box.appendChild(tapL); box.appendChild(tapR);
    wrap.appendChild(box); container.appendChild(wrap);
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
    const wrap = document.createElement("div"); wrap.className = "reader-page-wrap page-flip-container";
    
    const pageContainer = document.createElement("div");
    pageContainer.className = "flip-book";
    
    const tapL = document.createElement("div"); tapL.className = "r-tap-zone r-tap-left";
    tapL.onclick = e => { e.stopPropagation(); animateFlip(-1); };
    const tapR = document.createElement("div"); tapR.className = "r-tap-zone r-tap-right";
    tapR.onclick = e => { e.stopPropagation(); animateFlip(1); };
    
    const pageUnder = document.createElement("div");
    pageUnder.className = "flip-page flip-under";
    const imgUnder = document.createElement("img");
    imgUnder.style.display = "none";
    pageUnder.appendChild(imgUnder);

    const pageActive = document.createElement("div");
    pageActive.className = "flip-page flip-active";
    const imgActive = document.createElement("img");
    imgActive.src = readerPages[rPageIdx];
    imgActive.alt = `Page ${rPageIdx+1}`;
    pageActive.appendChild(imgActive);

    pageActive.onclick = () => toggleControls();

    pageContainer.appendChild(pageUnder);
    pageContainer.appendChild(pageActive);
    pageContainer.appendChild(tapL);
    pageContainer.appendChild(tapR);
    wrap.appendChild(pageContainer);
    container.appendChild(wrap);
  }
}

/* ===== ANIMATE FLIP (Simulation Page Turn) ===== */
function animateFlip(dir) {
  if (isFlipping) return;
  const next = rPageIdx + dir;
  if (next < 0 || next >= readerPages.length) {
    if (next >= readerPages.length) { stopAuto(); toast(t("readerEnd"), "info"); }
    return;
  }

  isFlipping = true;
  const activePage = document.querySelector(".flip-active");
  const underPage = document.querySelector(".flip-under");
  
  if (!activePage || !underPage) {
    rPageIdx = next;
    updateProgress();
    renderPage();
    isFlipping = false;
    return;
  }

  const imgActive = activePage.querySelector("img");
  const imgUnder = underPage.querySelector("img");

  if (dir === 1) {
    imgUnder.src = readerPages[next];
    imgUnder.style.display = "block";
    activePage.classList.add("flipping-next");

    setTimeout(() => {
      rPageIdx = next;
      updateProgress();
      imgActive.src = readerPages[rPageIdx];
      activePage.classList.remove("flipping-next");
      imgUnder.style.display = "none";
      isFlipping = false;
    }, 450);
  } else {
    imgUnder.src = readerPages[rPageIdx];
    imgUnder.style.display = "block";
    
    imgActive.src = readerPages[next];
    activePage.classList.add("flipping-prev-start");

    activePage.offsetWidth; // Force Reflow

    activePage.classList.remove("flipping-prev-start");
    activePage.classList.add("flipping-prev-animate");

    setTimeout(() => {
      rPageIdx = next;
      updateProgress();
      activePage.classList.remove("flipping-prev-animate");
      imgUnder.style.display = "none";
      isFlipping = false;
    }, 450);
  }
}

/* ===== PAGE NAVIGATION ===== */
function flipPage(dir) {
  if (rMode === "flip") {
    animateFlip(dir);
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
    if (img) { img.src = readerPages[rPageIdx]; }
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
    renderPage();
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
  document.getElementById("readerControls").classList.toggle("visible");
}

function toggleSidebar() {
  document.getElementById("readerSidebar").classList.toggle("active");
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
