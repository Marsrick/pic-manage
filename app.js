/* ===== I18N ===== */
const T = {
  zh: {
    myFiles: "文档小助手", adminSpace: "管理员空间", adminMode: "管理员",
    searchPlaceholder: "搜索文件...",
    catAll: "全部", catDoc: "文档", catImage: "图片", catComic: "漫画", catOther: "其他",
    recentFiles: "最近文件", allFiles: "全部文件",
    feedbackTitle: "问题反馈", feedbackDesc: "请描述您遇到的问题，我们会尽快处理",
    labelDesc: "反馈内容", phDesc: "请详细描述您遇到的问题或改进建议...",
    submitFeedback: "提交反馈", feedbackOk: "反馈提交成功，感谢！",
    gestureVerify: "验证管理员手势", gestureSetup: "设置管理员手势密码",
    gestureConfirm: "请再次绘制以确认", gestureHintDraw: "请绘制手势密码",
    gestureWrong: "手势错误，请重试", gestureMismatch: "两次绘制不一致，已重置",
    gestureTooShort: "至少需要连接4个点", gestureSetOk: "管理员手势设置成功！",
    gestureUnlockOk: "验证通过，欢迎进入管理员模式！",
    btnReset: "重置", btnCancel: "取消", btnClose: "关闭", btnDownload: "下载",
    forgotGesture: "忘记密码？",
    vaultTitle: "管理员空间", vaultDesc: "AES-256 本地加密 · 离线存储",
    uploadText: "点击或拖拽文件到此处导入",
    uploadHint: "支持图片、PDF、TXT 及 ZIP 漫画压缩包",
    encryptMode: "加密方式：AES-256 本地加密",
    storageChoice: "存储方式", storageChoiceDesc: "选择该文件的存储方式",
    storePrivate: "加密存储", storePrivateDesc: "AES-256加密，仅管理员可见",
    storePublic: "公开存储", storePublicDesc: "不加密，所有人可见",
    uploadOk: "文件上传成功！", uploadErr: "上传失败，请重试",
    confirmDel: "确认删除此文件？此操作无法恢复！", deleteOk: "文件已删除",
    emptyFiles: "暂无文件", emptyVault: "暂无私密文件，点击上方区域导入",
    navFiles: "文件", navFeedback: "问题反馈", navVault: "管理空间",
    adminLogout: "已退出管理员模式",
    readerBack: "返回", chapterList: "目录", btnChapter: "目录",
    modeClick: "左右翻页", modeFlip: "仿真翻页", modeSlide: "上下翻页", modeWebtoon: "瀑布模式",
    autoPlay: "自动翻页", interval: "间隔",
    play: "播放", pause: "暂停", readerEnd: "已到最后一页",
    decryptErr: "解密失败，密钥可能不匹配", fileTooLarge: "文件过大（建议50MB以内）",
    parsingZip: "正在解析漫画...", parseOk: "页漫画", parseErr: "解析失败",
    sessionExpired: "会话已过期，请重新验证手势",
    gestureResetOk: "手势已重置，请重新设置",
    forgotConfirm: "重置手势密码将导致已加密的文件无法解密！确定要重置吗？",
    backgroundLock: "检测到应用切换至后台，已加锁验证",
    securityTitle: "应用安全设置",
    securityDesc: "设置本应用启动与后台返回时的手势密码",
    enableLockLabel: "启用启动手势锁",
    btnSetNormalLock: "设置/修改手势密码",
    gestureSetupNormal: "设置启动手势密码",
    gestureNormalSetOk: "启动手势锁设置成功！"
  },
  en: {
    myFiles: "My Files", adminSpace: "Admin Space", adminMode: "Admin",
    searchPlaceholder: "Search files...",
    catAll: "All", catDoc: "Docs", catImage: "Images", catComic: "Comics", catOther: "Others",
    recentFiles: "Recent Files", allFiles: "All Files",
    feedbackTitle: "Feedback", feedbackDesc: "Describe any issues and we'll get back to you",
    labelDesc: "Details", phDesc: "Describe the issue or suggestions in detail...",
    submitFeedback: "Submit", feedbackOk: "Feedback submitted, thank you!",
    gestureVerify: "Verify Admin Gesture", gestureSetup: "Set Admin Gesture",
    gestureConfirm: "Draw again to confirm", gestureHintDraw: "Draw your unlock pattern",
    gestureWrong: "Incorrect pattern, try again", gestureMismatch: "Patterns don't match, reset",
    gestureTooShort: "Connect at least 4 nodes", gestureSetOk: "Admin gesture set!",
    gestureUnlockOk: "Access granted! Welcome to Admin Mode.",
    btnReset: "Reset", btnCancel: "Cancel", btnClose: "Close", btnDownload: "Download",
    forgotGesture: "Forgot password?",
    vaultTitle: "Admin Space", vaultDesc: "AES-256 Local Encryption · Offline Storage",
    uploadText: "Click or drag files here to import",
    uploadHint: "Supports images, PDF, TXT and ZIP comics",
    encryptMode: "Encryption: AES-256 Local",
    storageChoice: "Storage Mode", storageChoiceDesc: "Choose how to store this file",
    storePrivate: "Encrypted Storage", storePrivateDesc: "AES-256, admin only",
    storePublic: "Public Storage", storePublicDesc: "No encryption, visible to all",
    uploadOk: "File uploaded!", uploadErr: "Upload failed, try again",
    confirmDel: "Delete this file? This cannot be undone!", deleteOk: "File deleted",
    emptyFiles: "No files yet", emptyVault: "No private files. Import above.",
    navFiles: "Files", navFeedback: "Feedback", navVault: "Admin",
    adminLogout: "Admin mode logged out",
    readerBack: "Back", chapterList: "Chapters", btnChapter: "Chapters",
    modeClick: "Tap Flip", modeFlip: "Page Flip", modeSlide: "Vertical Slide", modeWebtoon: "Webtoon Scroll",
    autoPlay: "Auto Play", interval: "Speed",
    play: "Play", pause: "Pause", readerEnd: "Reached last page",
    decryptErr: "Decryption failed", fileTooLarge: "File too large (max 50MB)",
    parsingZip: "Parsing comic...", parseOk: " pages", parseErr: "Parse failed",
    sessionExpired: "Session expired, re-verify gesture",
    gestureResetOk: "Gesture reset. Please set a new one.",
    forgotConfirm: "Resetting gesture will make encrypted files unrecoverable! Continue?",
    backgroundLock: "App backgrounded. Lock screen triggered.",
    securityTitle: "Security Settings",
    securityDesc: "Configure gesture password for startup & resume",
    enableLockLabel: "Enable Startup Lock",
    btnSetNormalLock: "Set/Change Gesture Password",
    gestureSetupNormal: "Set Normal Gesture Password",
    gestureNormalSetOk: "Startup gesture lock enabled successfully!"
  }
};

/* ===== STATE ===== */
let lang = localStorage.getItem("pm_lang") || "zh";
let isAdmin = false;
let adminKey = null;
let db = null;
let gestureStep = 0; // 0=verify, 1=setup-first, 2=setup-confirm
let firstPattern = "";
let currentFilter = "all";
let pendingFile = null;
let isSettingNormalGesture = false;
let isStartupUnlock = false;
let multiSelectMode = false;
const multiSelectIds = new Set();
let actionMenuTargetId = null;
const pendingExternalUrls = [];
let appBootDone = false;
let currentFolder = null; // null = root; otherwise the folder name being viewed

const DB = "PicManageDB";
const STORE = "files";

/* ===== I18N UTILS ===== */
function t(k) { return T[lang]?.[k] || k; }

function applyLang() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n"); if (T[lang]?.[k]) el.textContent = T[lang][k];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const k = el.getAttribute("data-i18n-placeholder"); if (T[lang]?.[k]) el.placeholder = T[lang][k];
  });
  document.getElementById("langLabel").textContent = lang === "zh" ? "EN" : "中文";
}

function toggleLang() { lang = lang === "zh" ? "en" : "zh"; localStorage.setItem("pm_lang", lang); applyLang(); refreshFileList(); }

/* ===== DB ===== */
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onerror = () => rej(r.error);
    r.onsuccess = () => { db = r.result; res(db); };
    r.onupgradeneeded = e => { e.target.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true }); };
  });
}

function dbAdd(obj) { return new Promise((res, rej) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).add(obj).onsuccess = () => res(); tx.onerror = () => rej(tx.error); }); }
function dbAll() { return new Promise((res, rej) => { const tx = db.transaction(STORE, "readonly"); const r = tx.objectStore(STORE).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function dbDel(id) { return new Promise((res, rej) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).delete(id).onsuccess = () => res(); tx.onerror = () => rej(tx.error); }); }

/* ===== CRYPTO ===== */
async function deriveKey(gesture, salt) {
  const raw = new TextEncoder().encode(gesture);
  const base = await crypto.subtle.importKey("raw", raw, "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function encryptBuf(buf, gesture) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(gesture, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, buf);
  const out = new Uint8Array(16 + 12 + ct.byteLength);
  out.set(salt, 0); out.set(iv, 16); out.set(new Uint8Array(ct), 28);
  return out.buffer;
}

async function decryptBuf(buf, gesture) {
  const v = new Uint8Array(buf);
  const salt = v.slice(0, 16), iv = v.slice(16, 28), ct = v.slice(28);
  const key = await deriveKey(gesture, salt);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
}

async function sha256(msg) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ===== TOAST ===== */
function toast(msg, type = "info") {
  const el = document.getElementById("toast");
  el.textContent = msg; el.className = `toast show ${type}`;
  setTimeout(() => el.classList.remove("show"), 2800);
}

/* ===== NAV & VIEWS ===== */
const navHistory = ["viewFiles"];

function switchNav(viewId, btn, addToHistory = true) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(viewId)?.classList.add("active");

  const hdr = document.getElementById("headerTitle");
  const search = document.getElementById("searchBarWrap");
  const cats = document.getElementById("categoryTabs");
  const backBtn = document.getElementById("headerBack");
  const fab = document.getElementById("fabUpload");

  if (addToHistory && navHistory[navHistory.length - 1] !== viewId) {
    navHistory.push(viewId);
  }

  // Update back button visibility
  if (viewId === "viewFiles") {
    backBtn.style.display = "none";
  } else {
    backBtn.style.display = "block";
  }

  // Update upload FAB visibility
  if (viewId === "viewFiles") {
    if (fab) fab.style.display = "flex";
  } else {
    if (fab) fab.style.display = "none";
  }

  if (viewId === "viewFiles") {
    hdr.textContent = isAdmin ? t("adminSpace") : t("myFiles");
    search.style.display = ""; cats.style.display = "";
  } else if (viewId === "viewFeedback") {
    hdr.textContent = t("feedbackTitle");
    search.style.display = "none"; cats.style.display = "none";
  }
}

function goBack() {
  if (navHistory.length > 1) {
    navHistory.pop(); // remove current
    const prevView = navHistory[navHistory.length - 1];
    switchNav(prevView, null, false);
  } else {
    switchNav("viewFiles", null, false);
  }
}

function openFeedback() {
  switchNav("viewFeedback", null);
}

function triggerUpload() {
  document.getElementById("fileInput").click();
}

/* ===== FILE UTILS ===== */
function fmtSize(b) {
  if (!b) return "0 B";
  const u = ["B","KB","MB","GB"]; let i = 0;
  while (b >= 1024 && i < 3) { b /= 1024; i++; }
  return b.toFixed(i > 0 ? 1 : 0) + " " + u[i];
}

function fmtDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function getFileExt(name) { return (name || "").split(".").pop().toLowerCase(); }

function getFileCat(name) {
  const ext = getFileExt(name);
  if (["pdf","doc","docx","xls","xlsx","ppt","pptx"].includes(ext)) return "doc";
  if (["png","jpg","jpeg","gif","webp","svg","bmp"].includes(ext)) return "image";
  if (ext === "zip" || ext === "cbz" || ext === "cbr" || ext === "7z" || ext === "tar" || ext === "rar") return "comic";
  if (["txt","json","xml","js","html","css","md","log"].includes(ext)) return "doc";
  return "other";
}

/* ===== FORMAT DETECTION (magic bytes) ===== */
function detectMagicFormat(uint8) {
  if (!uint8 || uint8.length < 4) return "unknown";
  // ZIP / docx / xlsx / pptx / cbz
  if (uint8[0] === 0x50 && uint8[1] === 0x4B && (uint8[2] === 0x03 || uint8[2] === 0x05 || uint8[2] === 0x07)) return "zip";
  // 7z
  if (uint8.length >= 6 && uint8[0] === 0x37 && uint8[1] === 0x7A && uint8[2] === 0xBC && uint8[3] === 0xAF && uint8[4] === 0x27 && uint8[5] === 0x1C) return "7z";
  // RAR v5 (Rar!\x1a\x07\x01\x00) or v4 (Rar!\x1a\x07\x00)
  if (uint8.length >= 7 && uint8[0] === 0x52 && uint8[1] === 0x61 && uint8[2] === 0x72 && uint8[3] === 0x21 && uint8[4] === 0x1A && uint8[5] === 0x07) return "rar";
  // gzip
  if (uint8[0] === 0x1F && uint8[1] === 0x8B) return "gzip";
  // PDF
  if (uint8[0] === 0x25 && uint8[1] === 0x50 && uint8[2] === 0x44 && uint8[3] === 0x46) return "pdf";
  // PNG
  if (uint8.length >= 8 && uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47 && uint8[4] === 0x0D && uint8[5] === 0x0A && uint8[6] === 0x1A && uint8[7] === 0x0A) return "png";
  // JPEG
  if (uint8.length >= 3 && uint8[0] === 0xFF && uint8[1] === 0xD8 && uint8[2] === 0xFF) return "jpeg";
  // GIF
  if (uint8.length >= 6 && uint8[0] === 0x47 && uint8[1] === 0x49 && uint8[2] === 0x46 && uint8[3] === 0x38) return "gif";
  // WEBP (RIFF....WEBP)
  if (uint8.length >= 12 && uint8[0] === 0x52 && uint8[1] === 0x49 && uint8[2] === 0x46 && uint8[3] === 0x46 && uint8[8] === 0x57 && uint8[9] === 0x45 && uint8[10] === 0x42 && uint8[11] === 0x50) return "webp";
  // BMP
  if (uint8[0] === 0x42 && uint8[1] === 0x4D) return "bmp";
  // Legacy MS Office (.doc/.xls/.ppt) — OLE compound
  if (uint8.length >= 8 && uint8[0] === 0xD0 && uint8[1] === 0xCF && uint8[2] === 0x11 && uint8[3] === 0xE0 && uint8[4] === 0xA1 && uint8[5] === 0xB1 && uint8[6] === 0x1A && uint8[7] === 0xE1) return "msoffice-legacy";
  // tar (ustar marker at offset 257)
  if (uint8.length >= 262 && uint8[257] === 0x75 && uint8[258] === 0x73 && uint8[259] === 0x74 && uint8[260] === 0x61 && uint8[261] === 0x72) return "tar";
  return "unknown";
}

function isLikelyText(uint8) {
  if (!uint8 || uint8.length === 0) return false;
  // UTF-8 BOM
  if (uint8.length >= 3 && uint8[0] === 0xEF && uint8[1] === 0xBB && uint8[2] === 0xBF) return true;
  const sampleLen = Math.min(uint8.length, 512);
  let printable = 0, control = 0;
  for (let i = 0; i < sampleLen; i++) {
    const b = uint8[i];
    if (b === 0) return false; // NUL is a strong signal of binary
    if ((b >= 0x20 && b <= 0x7E) || b === 0x09 || b === 0x0A || b === 0x0D) printable++;
    else if (b >= 0x80) printable++; // UTF-8 multi-byte (rough heuristic)
    else control++;
  }
  return printable / sampleLen > 0.9;
}

async function probeBlobFormat(blob) {
  const head = new Uint8Array(await blob.slice(0, 512).arrayBuffer());
  const fmt = detectMagicFormat(head);
  return { fmt, isText: fmt === "unknown" && isLikelyText(head) };
}

function isArchiveFormat(fmt) { return ["zip", "7z", "gzip", "tar", "rar"].includes(fmt); }
function isImageFormat(fmt) { return ["png", "jpeg", "gif", "webp", "bmp"].includes(fmt); }

function getIconClass(name) {
  const cat = getFileCat(name);
  if (cat === "comic") return "zip";
  if (cat === "image") return "img";
  if (cat === "doc") {
    const ext = getFileExt(name);
    if (ext === "pdf") return "pdf";
    if (ext === "txt" || ext === "json" || ext === "md") return "txt";
    return "doc";
  }
  return "other";
}

function getIconSVG(name) {
  const cls = getIconClass(name);
  const icons = {
    zip: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>`,
    img: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/></svg>`,
    pdf: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>`,
    doc: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>`,
    txt: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.25 12H8.25m6.75 3H8.25M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>`,
    other: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>`
  };
  return icons[cls] || icons.other;
}

/* ===== RENDER FILE LIST (Public) ===== */
async function refreshFileList() {
  const area = document.getElementById("fileListArea");
  try {
    const all = await dbAll();
    const base = isAdmin ? all : all.filter(f => !f.isPrivate);
    updateCategoryCounts(base);

    const q = document.getElementById("searchInput").value.trim().toLowerCase();
    const searching = !!q;

    // Folder/root grouped view (only when at root, no active search)
    if (currentFolder === null && !searching) {
      const folderNames = [...new Set(base.filter(f => f.folder).map(f => f.folder))].sort();
      let rootFiles = base.filter(f => !f.folder);
      if (currentFilter !== "all") rootFiles = rootFiles.filter(f => getFileCat(f.name) === currentFilter);

      let html = "";
      if (currentFilter === "all") html += folderNames.map(n => renderFolderRow(n, base)).join("");
      html += rootFiles.map(f => renderFileRow(f, isAdmin)).join("");

      if (!html) {
        area.innerHTML = emptyPlaceholderHtml();
        return;
      }
      area.innerHTML = html;
      bindFileRowEvents(area);
      bindFolderEvents(area);
      return;
    }

    // Flat view: inside a folder OR searching across everything
    let filtered;
    if (currentFolder !== null) filtered = base.filter(f => f.folder === currentFolder);
    else filtered = base;
    if (currentFilter !== "all") filtered = filtered.filter(f => getFileCat(f.name) === currentFilter);
    if (q) filtered = filtered.filter(f => f.name.toLowerCase().includes(q));

    let html = "";
    if (currentFolder !== null) html += renderBackRow(currentFolder);
    html += filtered.map(f => renderFileRow(f, isAdmin)).join("");

    if (currentFolder === null && filtered.length === 0) {
      area.innerHTML = emptyPlaceholderHtml();
      return;
    }
    area.innerHTML = html;
    bindFileRowEvents(area);
    bindFolderEvents(area);
  } catch (e) { console.error(e); }
}

function emptyPlaceholderHtml() {
  return `<div class="empty-placeholder"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg><p>${t("emptyFiles")}</p></div>`;
}

function renderFolderRow(name, base) {
  const count = base.filter(f => f.folder === name).length;
  return `
    <div class="file-row folder-row" data-folder="${name}">
      <div class="file-icon-wrap folder"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg></div>
      <div class="file-info">
        <div class="file-name">${name}</div>
        <div class="file-meta-row"><span class="file-size-text">${count} 项</span></div>
      </div>
      <div class="file-row-actions">
        <button class="file-action-btn danger folder-del-btn" title="删除文件夹"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg></button>
      </div>
    </div>`;
}

function renderBackRow(folderName) {
  return `
    <div class="file-row back-row" id="folderBackRow">
      <div class="file-icon-wrap"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg></div>
      <div class="file-info"><div class="file-name">${folderName}</div><div class="file-meta-row"><span class="file-size-text">返回上级</span></div></div>
    </div>`;
}

function bindFolderEvents(area) {
  area.querySelectorAll(".folder-row").forEach(row => {
    row.addEventListener("click", e => {
      if (e.target.closest(".folder-del-btn")) return;
      currentFolder = row.dataset.folder;
      refreshFileList();
    });
  });
  area.querySelectorAll(".folder-del-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      e.stopPropagation();
      const name = btn.closest(".folder-row").dataset.folder;
      if (!confirm(`删除文件夹「${name}」及其中所有文件？此操作无法恢复！`)) return;
      const all = await dbAll();
      for (const f of all.filter(x => x.folder === name)) await dbDel(f.id);
      toast(t("deleteOk"), "success");
      refreshFileList();
    });
  });
  const back = area.querySelector("#folderBackRow");
  if (back) back.addEventListener("click", () => { currentFolder = null; refreshFileList(); });
}

function renderFileRow(f, showLock) {
  const iconCls = getIconClass(f.name);
  const lockBadge = (showLock && f.isPrivate) ? `<div class="file-lock-badge"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75"/></svg></div>` : "";
  const selected = multiSelectIds.has(f.id) ? " selected" : "";
  const checkboxHtml = multiSelectMode
    ? `<div class="file-checkbox${multiSelectIds.has(f.id) ? " checked" : ""}"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg></div>`
    : "";

  return `
    <div class="file-row${selected}" data-id="${f.id}" data-name="${f.name}">
      ${checkboxHtml}
      <div class="file-icon-wrap ${iconCls}">${getIconSVG(f.name)}${lockBadge}</div>
      <div class="file-info">
        <div class="file-name">${f.name}</div>
        <div class="file-meta-row">
          <span class="file-size-text">${fmtSize(f.size)}</span>
          <span class="file-date-text">${fmtDate(f.uploadedAt)}</span>
        </div>
      </div>
      <div class="file-row-actions">
        <button class="file-action-btn view-btn" title="查看"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></button>
        <button class="file-action-btn more-btn" title="更多"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"/></svg></button>
      </div>
    </div>`;
}

function bindFileRowEvents(area) {
  area.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      e.stopPropagation();
      const row = btn.closest(".file-row");
      const id = Number(row.dataset.id);
      const all = await dbAll();
      const f = all.find(x => x.id === id);
      if (f) openFileView(f);
    });
  });
  area.querySelectorAll(".more-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      e.stopPropagation();
      const id = Number(btn.closest(".file-row").dataset.id);
      openActionMenu(id);
    });
  });
  area.querySelectorAll(".file-row").forEach(row => {
    if (row.dataset.id === undefined) return; // skip folder/back rows
    row.addEventListener("click", async () => {
      const id = Number(row.dataset.id);
      if (multiSelectMode) {
        toggleSelection(id);
        return;
      }
      const all = await dbAll();
      const f = all.find(x => x.id === id);
      if (f) openFileView(f);
    });
  });
}

function updateCategoryCounts(files) {
  document.getElementById("countAll").textContent = files.length;
  document.getElementById("countDoc").textContent = files.filter(f => getFileCat(f.name) === "doc").length;
  document.getElementById("countImage").textContent = files.filter(f => getFileCat(f.name) === "image").length;
  document.getElementById("countComic").textContent = files.filter(f => getFileCat(f.name) === "comic").length;
  document.getElementById("countOther").textContent = files.filter(f => getFileCat(f.name) === "other").length;
}

function filterCategory(cat) {
  currentFilter = cat;
  currentFolder = null;
  document.querySelectorAll(".cat-tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`.cat-tab[data-cat="${cat}"]`)?.classList.add("active");
  refreshFileList();
}

/* ===== SEARCH ===== */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchInput").addEventListener("input", () => refreshFileList());
});

/* ===== FEEDBACK DISGUISE ===== */
function initFeedback() {
  document.getElementById("feedbackForm").addEventListener("submit", e => {
    e.preventDefault();
    const val = document.getElementById("fbContent").value.trim();
    if (val === "6627") {
      document.getElementById("fbContent").value = "";
      openGesture();
    } else {
      toast(t("feedbackOk"), "success");
      document.getElementById("fbContent").value = "";
    }
  });
}

/* ===== GESTURE LOCK ===== */
let canvas, ctx;
const nodes = [];
const path = [];
let drawing = false;

function openGesture() {
  const overlay = document.getElementById("gestureOverlay");
  overlay.classList.add("active");
  canvas = document.getElementById("gestureCanvas");
  ctx = canvas.getContext("2d");
  canvas.width = 260; canvas.height = 260;

  nodes.length = 0;
  const pad = 40, step = (260 - pad * 2) / 2;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) nodes.push({ x: pad + c * step, y: pad + r * step, id: r * 3 + c });

  // Handle cancel button visibility
  const cancelBtn = document.querySelector("#gestureOverlay .g-btn-outline[onclick='closeGesture()']");
  if (isStartupUnlock) {
    if (cancelBtn) cancelBtn.style.display = "none";
  } else {
    if (cancelBtn) cancelBtn.style.display = "";
  }

  if (isSettingNormalGesture) {
    gestureStep = 1;
    document.getElementById("gTitle").textContent = t("gestureSetupNormal");
  } else {
    const hash = localStorage.getItem("g_hash");
    const normalHash = localStorage.getItem("g_normal_hash");
    if (hash || normalHash) {
      gestureStep = 0; // Verify
      document.getElementById("gTitle").textContent = t("gestureVerify");
    } else {
      gestureStep = 1; // Setup admin by default
      document.getElementById("gTitle").textContent = t("gestureSetup");
    }
  }

  document.getElementById("gHint").textContent = t("gestureHintDraw");
  document.getElementById("gHint").classList.remove("error");
  firstPattern = "";
  path.length = 0;
  drawBoard();

  canvas.onmousedown = e => startDraw(pos(e));
  canvas.onmousemove = e => { if (drawing) moveDraw(pos(e)); };
  window.onmouseup = endDraw;
  canvas.ontouchstart = e => { e.preventDefault(); startDraw(tpos(e)); };
  canvas.ontouchmove = e => { e.preventDefault(); moveDraw(tpos(e)); };
  window.ontouchend = endDraw;
}

function closeGesture() {
  document.getElementById("gestureOverlay").classList.remove("active");
  drawing = false;
  path.length = 0;
  isSettingNormalGesture = false;
  isStartupUnlock = false;

  // If this was a background re-auth and user cancelled, stay in normal user mode
  if (backgroundReAuth) {
    backgroundReAuth = false;
    sessionStorage.removeItem("isAdminActive");
    // Ensure UI is fully reset to normal user mode
    isAdmin = false;
    adminKey = null;
    document.getElementById("adminBadge").style.display = "none";
    document.getElementById("logoutAdminBtn").style.display = "none";
    switchNav("viewFiles", null);
    refreshFileList();
    // User declined admin re-auth — proceed as normal user and drain queued files
    markAppBootDone();
  }
}

function pos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function tpos(e) { const r = canvas.getBoundingClientRect(); const t = e.touches[0]; return { x: t.clientX - r.left, y: t.clientY - r.top }; }

function startDraw(p) { drawing = true; path.length = 0; hitTest(p); drawBoard(p); }
function moveDraw(p) { if (!drawing) return; hitTest(p); drawBoard(p); }

async function endDraw() {
  if (!drawing) return; drawing = false; drawBoard();
  if (path.length < 4) { if (path.length > 0) { setHint(t("gestureTooShort"), true); } path.length = 0; drawBoard(); return; }

  const pat = path.join("-");
  const hint = document.getElementById("gHint");

  if (gestureStep === 1) {
    firstPattern = pat; gestureStep = 2;
    document.getElementById("gTitle").textContent = t("gestureConfirm");
    setHint(t("gestureHintDraw")); path.length = 0; drawBoard();
  } else if (gestureStep === 2) {
    if (pat === firstPattern) {
      const h = await sha256(pat);
      if (isSettingNormalGesture) {
        localStorage.setItem("g_normal_hash", h);
        localStorage.setItem("g_startup_lock_enabled", "true");
        toast(t("gestureNormalSetOk"), "success");
        isSettingNormalGesture = false;
        closeGesture();
        updateSecuritySettingsUI();
      } else {
        localStorage.setItem("g_hash", h);
        adminKey = pat; isAdmin = true;
        toast(t("gestureSetOk"), "success");
        enterAdmin(); closeGesture();
      }
    } else {
      setHint(t("gestureMismatch"), true);
      gestureStep = 1; firstPattern = "";
      document.getElementById("gTitle").textContent = isSettingNormalGesture ? t("gestureSetupNormal") : t("gestureSetup");
      path.length = 0; drawBoard();
    }
  } else {
    // Verification mode (including startup unlock and background re-auth)
    const savedAdmin = localStorage.getItem("g_hash");
    const savedNormal = localStorage.getItem("g_normal_hash");
    const h = await sha256(pat);

    let matchedAdmin = (savedAdmin && h === savedAdmin);
    let matchedNormal = (savedNormal && h === savedNormal);

    if (matchedAdmin && matchedNormal) {
      // Both match -> Enter normal user mode (public view)
      isStartupUnlock = false;
      backgroundReAuth = false;
      sessionStorage.removeItem("isAdminActive");
      isAdmin = false;
      adminKey = null;
      document.getElementById("adminBadge").style.display = "none";
      document.getElementById("logoutAdminBtn").style.display = "none";
      switchNav("viewFiles", null);
      refreshFileList();
      toast(t("gestureUnlockOk"), "success");
      closeGesture();
      markAppBootDone();
    } else if (matchedAdmin) {
      // Admin matches -> Enter admin mode
      isStartupUnlock = false;
      backgroundReAuth = false;
      adminKey = pat; isAdmin = true;
      toast(t("gestureUnlockOk"), "success");
      enterAdmin(); closeGesture();
    } else if (matchedNormal) {
      // Normal matches -> Enter normal user mode
      isStartupUnlock = false;
      backgroundReAuth = false;
      sessionStorage.removeItem("isAdminActive");
      isAdmin = false;
      adminKey = null;
      document.getElementById("adminBadge").style.display = "none";
      document.getElementById("logoutAdminBtn").style.display = "none";
      switchNav("viewFiles", null);
      refreshFileList();
      toast(t("gestureUnlockOk"), "success");
      closeGesture();
      markAppBootDone();
    } else {
      if (backgroundReAuth || isStartupUnlock) {
        if (isStartupUnlock) {
          setHint(t("gestureWrong"), true); path.length = 0; drawBoard();
        } else {
          // Silent exit on background resume without startup lock
          closeGesture();
        }
      } else {
        setHint(t("gestureWrong"), true); path.length = 0; drawBoard();
      }
    }
  }
}

function setHint(msg, isErr = false) {
  const h = document.getElementById("gHint");
  h.textContent = msg;
  h.classList.toggle("error", isErr);
}

function hitTest(p) {
  for (const n of nodes) {
    if (Math.hypot(p.x - n.x, p.y - n.y) < 28 && !path.includes(n.id)) {
      path.push(n.id);
      if (navigator.vibrate) navigator.vibrate(12);
    }
  }
}

function drawBoard(mouse = null) {
  ctx.clearRect(0, 0, 260, 260);
  // Lines
  if (path.length > 0) {
    ctx.beginPath(); ctx.strokeStyle = "rgba(59,130,246,0.8)"; ctx.lineWidth = 5; ctx.lineCap = "round";
    const f = nodes[path[0]]; ctx.moveTo(f.x, f.y);
    for (let i = 1; i < path.length; i++) { const n = nodes[path[i]]; ctx.lineTo(n.x, n.y); }
    if (mouse && drawing) ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
  }
  // Nodes
  for (const n of nodes) {
    const on = path.includes(n.id);
    ctx.beginPath(); ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = on ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)";
    ctx.strokeStyle = on ? "#3b82f6" : "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = on ? "#3b82f6" : "rgba(255,255,255,0.25)"; ctx.fill();
  }
}

function resetGestureData() {
  path.length = 0; firstPattern = "";
  gestureStep = localStorage.getItem("g_hash") ? 0 : 1;
  document.getElementById("gTitle").textContent = gestureStep === 0 ? t("gestureVerify") : t("gestureSetup");
  setHint(t("gestureHintDraw")); drawBoard();
}

function forgetGesture() {
  if (!confirm(t("forgotConfirm"))) return;
  localStorage.removeItem("g_hash");
  toast(t("gestureResetOk"), "info");
  resetGestureData();
  gestureStep = 1;
  document.getElementById("gTitle").textContent = t("gestureSetup");
}

/* ===== ADMIN MODE ===== */
function enterAdmin() {
  isAdmin = true;
  localStorage.setItem("wasAdminBeforeBackground", "true");
  document.getElementById("adminBadge").style.display = "flex";
  document.getElementById("logoutAdminBtn").style.display = "";
  switchNav("viewFiles", null);
  refreshFileList();
  markAppBootDone();
}

function logoutAdmin() {
  isAdmin = false; adminKey = null;
  currentFolder = null;
  localStorage.removeItem("wasAdminBeforeBackground");
  document.getElementById("adminBadge").style.display = "none";
  document.getElementById("logoutAdminBtn").style.display = "none";
  switchNav("viewFiles", null);
  refreshFileList();
  toast(t("adminLogout"), "info");
}

/* ===== BACKGROUND LOCK (visibilitychange, pause/resume, pagehide/pageshow) ===== */
let backgroundReAuth = false; // Flag: we are in re-authentication mode after background resume

function handleAppBackground() {
  // Lock the external-file queue whenever the app loses foreground so
  // that any URL delivered on the way back up (e.g. WeChat -> "Open with")
  // waits for the re-auth flow to resolve before prepUpload runs.
  appBootDone = false;

  if (isAdmin) {
    adminKey = null;
    isAdmin = false;
    document.getElementById("adminBadge").style.display = "none";
    document.getElementById("logoutAdminBtn").style.display = "none";
    refreshFileList();
  }
}

function triggerBackgroundReAuth() {
  // If gesture overlay is already active, don't trigger again
  if (document.getElementById("gestureOverlay").classList.contains("active")) {
    return;
  }

  const wasAdmin = localStorage.getItem("wasAdminBeforeBackground") === "true";
  const startupLock = localStorage.getItem("g_startup_lock_enabled") === "true";
  const adminHash = localStorage.getItem("g_hash");
  const normalHash = localStorage.getItem("g_normal_hash");

  const willPromptGesture = (wasAdmin || startupLock) && (adminHash || normalHash);

  if (willPromptGesture) {
    // Clear immediately to prevent double trigger on subsequent resume/pageshow events
    localStorage.removeItem("wasAdminBeforeBackground");

    if (startupLock) {
      isStartupUnlock = true;
    } else {
      backgroundReAuth = true;
    }
    toast(t("backgroundLock"), "info");

    // Reset views first for safety
    switchNav("viewFiles", null);
    refreshFileList();

    isAdmin = false;
    adminKey = null;
    document.getElementById("adminBadge").style.display = "none";
    document.getElementById("logoutAdminBtn").style.display = "none";

    openGesture();
    // markAppBootDone will run from the gesture-success handler
  } else {
    // No re-auth required — release the external-file queue immediately.
    markAppBootDone();
  }
}

function initBackgroundLock() {
  // Standard visibilitychange
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      handleAppBackground();
    } else if (document.visibilityState === "visible") {
      triggerBackgroundReAuth();
    }
  });

  // Cordova/Capacitor pause & resume events
  document.addEventListener("pause", handleAppBackground);
  document.addEventListener("resume", triggerBackgroundReAuth);

  // iOS Safari pagehide & pageshow events
  window.addEventListener("pagehide", handleAppBackground);
  window.addEventListener("pageshow", (e) => {
    triggerBackgroundReAuth();
  });
}

/* ===== IMAGE ZOOM & PAN (pinch / double-tap / drag) ===== */
// Attaches pinch-zoom, double-tap toggle and drag-pan to an <img>.
// onZoomChange(zoomed) lets callers (e.g. comic reader) disable paging while zoomed.
function enableImageZoom(img, container, onZoomChange, opts) {
  const allowDoubleTap = !opts || opts.doubleTap !== false;
  let scale = 1, tx = 0, ty = 0;
  let startDist = 0, startScale = 1;
  let startX = 0, startY = 0, startTx = 0, startTy = 0;
  let mode = null; // 'pinch' | 'pan'
  let lastTap = 0;
  const evtEl = container || img;

  img.style.transformOrigin = "center center";
  img.style.willChange = "transform";
  img.style.touchAction = "none";

  const dist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };
  const clampVal = (v, min, max) => Math.min(max, Math.max(min, v));

  function clampPan() {
    const cw = (container || img.parentElement).clientWidth;
    const ch = (container || img.parentElement).clientHeight;
    const maxX = Math.max(0, (img.offsetWidth * scale - cw) / 2);
    const maxY = Math.max(0, (img.offsetHeight * scale - ch) / 2);
    tx = clampVal(tx, -maxX, maxX);
    ty = clampVal(ty, -maxY, maxY);
  }

  function apply(animate) {
    img.style.transition = animate ? "transform 0.18s ease" : "none";
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (onZoomChange) onZoomChange(scale > 1.1);
  }

  function reset(animate) { scale = 1; tx = 0; ty = 0; apply(animate); }

  evtEl.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      mode = "pinch";
      startDist = dist(e.touches);
      startScale = scale;
      e.preventDefault();
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (allowDoubleTap && now - lastTap < 300) {
        // double tap: toggle 1x <-> 2.5x
        if (scale > 1.1) reset(true);
        else { scale = 2.5; clampPan(); apply(true); }
        lastTap = 0;
        e.preventDefault();
        return;
      }
      lastTap = now;
      if (scale > 1.1) {
        mode = "pan";
        startX = e.touches[0].clientX; startY = e.touches[0].clientY;
        startTx = tx; startTy = ty;
      } else {
        mode = null; // not zoomed: let underlying tap zones handle paging
      }
    }
  }, { passive: false });

  evtEl.addEventListener("touchmove", (e) => {
    if (mode === "pinch" && e.touches.length === 2) {
      e.preventDefault();
      const d = dist(e.touches);
      scale = clampVal(startScale * (d / startDist), 1, 5);
      clampPan();
      apply(false);
    } else if (mode === "pan" && e.touches.length === 1 && scale > 1.1) {
      e.preventDefault();
      tx = startTx + (e.touches[0].clientX - startX);
      ty = startTy + (e.touches[0].clientY - startY);
      clampPan();
      apply(false);
    }
  }, { passive: false });

  evtEl.addEventListener("touchend", (e) => {
    if (e.touches.length === 0) {
      mode = null;
      if (scale <= 1.1) reset(true);
    } else if (e.touches.length === 1) {
      // transition from pinch to single-finger pan
      mode = scale > 1.1 ? "pan" : null;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      startTx = tx; startTy = ty;
    }
  });

  // expose reset for callers
  img._resetZoom = () => reset(false);
}

/* ===== UPLOAD ===== */
function initUpload() {
  const zone = document.getElementById("uploadArea");
  const input = document.getElementById("fileInput");

  if (zone) {
    zone.addEventListener("click", () => input.click());
    zone.addEventListener("dragover", e => { e.preventDefault(); zone.style.borderColor = "var(--accent-blue)"; });
    zone.addEventListener("dragleave", () => { zone.style.borderColor = ""; });
    zone.addEventListener("drop", e => { e.preventDefault(); zone.style.borderColor = ""; if (e.dataTransfer.files[0]) prepUpload(e.dataTransfer.files[0]); });
  }
  if (input) {
    input.addEventListener("change", e => { if (e.target.files[0]) prepUpload(e.target.files[0]); });
  }
}

function prepUpload(file) {
  if (file.size > 500 * 1024 * 1024) { toast(t("fileTooLarge"), "error"); return; }
  pendingFile = file;
  if (isAdmin) {
    document.getElementById("choiceDialog").classList.add("active");
  } else {
    // Normal user: directly upload to public storage, skip encryption dialog
    saveFileAs(false);
  }
}

function cancelUpload() { pendingFile = null; document.getElementById("choiceDialog").classList.remove("active"); document.getElementById("fileInput").value = ""; }

async function saveFileAs(isPrivate) {
  document.getElementById("choiceDialog").classList.remove("active");
  if (!pendingFile) return;

  try {
    const buf = await pendingFile.arrayBuffer();
    let data;
    if (isPrivate) {
      if (!adminKey) { toast(t("sessionExpired"), "error"); return; }
      const enc = await encryptBuf(buf, adminKey);
      data = new Blob([enc]);
    } else {
      data = new Blob([buf]);
    }

    await dbAdd({ name: pendingFile.name, size: pendingFile.size, type: pendingFile.type, isPrivate, uploadedAt: Date.now(), data });
    toast(t("uploadOk"), "success");
    pendingFile = null; document.getElementById("fileInput").value = "";
    refreshFileList();
  } catch (e) { console.error(e); toast(t("uploadErr"), "error"); }
}

async function dbGet(id) {
  const all = await dbAll();
  return all.find(x => x.id === id);
}

function dbPut(obj) {
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(obj).onsuccess = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

/* ===== ACTION MENU ===== */
function openActionMenu(id) {
  actionMenuTargetId = id;
  dbGet(id).then(f => {
    if (!f) return;
    const menu = document.getElementById("actionMenu");
    const ext = getFileExt(f.name);
    const probableArchive = ["zip","cbz","cbr","7z","tar","gz","tgz","rar","log"].includes(ext);
    menu.querySelector('[data-act="extract"]').style.display = probableArchive ? "" : "none";
    menu.querySelector('[data-act="extract"]').textContent =
      (isAdmin || ["zip","cbz","cbr","7z","tar","gz","tgz","rar"].includes(ext)) ? "解压" : "解压（管理员）";
    menu.classList.add("active");
  });
}

function closeActionMenu() {
  document.getElementById("actionMenu").classList.remove("active");
  actionMenuTargetId = null;
}

async function handleActionClick(act) {
  const id = actionMenuTargetId;
  closeActionMenu();
  if (!id) return;
  if (act === "rename") openRenameDialog(id);
  else if (act === "delete") {
    if (confirm(t("confirmDel"))) {
      await dbDel(id);
      toast(t("deleteOk"), "success");
      refreshFileList();
    }
  } else if (act === "extract") {
    extractFileById(id);
  }
}

/* ===== RENAME ===== */
function openRenameDialog(id) {
  dbGet(id).then(f => {
    if (!f) return;
    const input = document.getElementById("renameInput");
    input.value = f.name;
    input.dataset.id = String(id);
    document.getElementById("renameDialog").classList.add("active");
    setTimeout(() => input.focus(), 100);
  });
}

function closeRename() {
  document.getElementById("renameDialog").classList.remove("active");
}

async function confirmRename() {
  const input = document.getElementById("renameInput");
  const id = Number(input.dataset.id);
  const newName = input.value.trim();
  if (!newName) { toast("名称不能为空", "error"); return; }
  const f = await dbGet(id);
  if (!f) return;
  f.name = newName;
  await dbPut(f);
  closeRename();
  toast("已重命名", "success");
  refreshFileList();
}

/* ===== EXTRACT (archive → individual files) ===== */
async function extractFileById(id) {
  const f = await dbGet(id);
  if (!f) return;

  // Decrypt if private
  let blob;
  if (f.isPrivate) {
    if (!adminKey) { toast(t("sessionExpired"), "error"); return; }
    try {
      const dec = await decryptBuf(await f.data.arrayBuffer(), adminKey);
      blob = new Blob([dec]);
    } catch (e) { toast(t("decryptErr"), "error"); return; }
  } else {
    blob = f.data;
  }

  const { fmt } = await probeBlobFormat(blob);
  if (!isArchiveFormat(fmt) && !["zip","cbz","cbr","7z","tar","gz","tgz","rar"].includes(getFileExt(f.name))) {
    toast("此文件不是压缩包", "info");
    return;
  }
  // Mismatched extension → admin required
  const declaredArchive = ["zip","cbz","cbr","7z","tar","gz","tgz","rar"].includes(getFileExt(f.name));
  if (!declaredArchive && !isAdmin) {
    toast("解压伪装文件需管理员权限", "error");
    return;
  }

  toast("正在解压...", "info");
  try {
    if (typeof extractAllImagesRecursive !== "function") {
      throw new Error("解压模块未加载");
    }
    // Use the existing recursive extractor — returns image blobs.
    // For non-image archive members we re-walk via the raw extractors below.
    const buf = await blob.arrayBuffer();
    const entries = await extractAllFilesRecursive(f.name, buf);
    if (!entries.length) { toast("压缩包为空或无法解析", "error"); return; }

    // Place extracted files into a new, uniquely-named folder
    const all = await dbAll();
    const existingFolders = new Set(all.filter(x => x.folder).map(x => x.folder));
    let baseName = f.name.replace(/\.[^.]+$/, "").replace(/[\\/]/g, "_") || "解压";
    let folder = baseName;
    let n = 2;
    while (existingFolders.has(folder)) { folder = `${baseName} (${n})`; n++; }

    let added = 0;
    for (const e of entries) {
      const entryName = (e.name || "file").split("/").pop();
      const entryBlob = new Blob([e.data]);
      let stored = entryBlob;
      if (f.isPrivate) {
        const enc = await encryptBuf(await entryBlob.arrayBuffer(), adminKey);
        stored = new Blob([enc]);
      }
      await dbAdd({
        name: entryName,
        folder,
        size: entryBlob.size,
        type: "",
        isPrivate: !!f.isPrivate,
        uploadedAt: Date.now(),
        data: stored
      });
      added++;
    }
    toast(`已解压 ${added} 个文件到「${folder}」`, "success");
    currentFolder = folder;
    refreshFileList();
  } catch (e) {
    console.error("[extract] error:", e);
    toast("解压失败: " + (e.message || e), "error");
  }
}

// All-files variant of extractAllImagesRecursive (defined in reader.js).
// Returns every file (not just images), recursively unwrapping archives.
async function extractAllFilesRecursive(name, arrayBuffer) {
  const out = [];
  let format = (typeof detectMagicType === "function") ? detectMagicType(arrayBuffer) : null;
  if (!format) {
    const ext = name.split(".").pop().toLowerCase();
    if (["zip","cbz","cbr"].includes(ext)) format = "zip";
    else if (ext === "7z") format = "7z";
    else if (ext === "tar") format = "tar";
    else if (ext === "gz" || ext === "tgz") format = "gzip";
  }
  // Also try our own detection
  if (!format) {
    const head = new Uint8Array(arrayBuffer.slice(0, 512));
    const detected = detectMagicFormat(head);
    if (isArchiveFormat(detected)) format = detected;
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
      const inner = detectMagicFormat(new Uint8Array(entryBuf.slice(0, 512)));
      if (isArchiveFormat(inner)) {
        const sub = await extractAllFilesRecursive(entry.name, entryBuf);
        out.push(...sub);
      } else {
        out.push({ name: entry.name, data: new Uint8Array(entryBuf) });
      }
    }
  } else if (format === "7z") {
    const files = await extract7z(arrayBuffer);
    for (const file of files) {
      const inner = detectMagicFormat(file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data.buffer));
      if (isArchiveFormat(inner)) {
        const buf = (file.data instanceof Uint8Array) ? file.data.buffer.slice(file.data.byteOffset, file.data.byteOffset + file.data.byteLength) : file.data.buffer;
        const sub = await extractAllFilesRecursive(file.name, buf);
        out.push(...sub);
      } else {
        out.push({ name: file.name, data: file.data });
      }
    }
  } else if (format === "gzip") {
    const uint8 = new Uint8Array(arrayBuffer);
    const decompressed = pako.ungzip(uint8);
    const inner = detectMagicFormat(decompressed);
    if (inner === "tar" || name.toLowerCase().endsWith(".tar.gz") || name.toLowerCase().endsWith(".tgz")) {
      const sub = await extractAllFilesRecursive(name.replace(/\.gz$|\.tgz$/i, ".tar"), decompressed.buffer);
      out.push(...sub);
    } else {
      out.push({ name: name.replace(/\.gz$/i, ""), data: decompressed });
    }
  } else if (format === "tar") {
    const tarFiles = parseTar(arrayBuffer);
    for (const file of tarFiles) {
      const inner = detectMagicFormat(file.data);
      if (isArchiveFormat(inner)) {
        const buf = file.data.buffer.slice(file.data.byteOffset, file.data.byteOffset + file.data.byteLength);
        const sub = await extractAllFilesRecursive(file.name, buf);
        out.push(...sub);
      } else {
        out.push({ name: file.name, data: file.data });
      }
    }
  }
  return out;
}

/* ===== MULTI-SELECT + COMPRESS ===== */
function toggleMultiSelect() {
  multiSelectMode = !multiSelectMode;
  multiSelectIds.clear();
  document.getElementById("multiSelectBtn")?.classList.toggle("active", multiSelectMode);
  document.getElementById("fabCompress").style.display = multiSelectMode ? "flex" : "none";
  document.getElementById("multiSelectBar").style.display = multiSelectMode ? "flex" : "none";
  // Hide upload FAB while multi-selecting
  const fab = document.getElementById("fabUpload");
  if (fab) fab.style.display = multiSelectMode ? "none" : "flex";
  refreshFileList();
}

function toggleSelection(id) {
  if (multiSelectIds.has(id)) multiSelectIds.delete(id);
  else multiSelectIds.add(id);
  refreshFileList();
  document.getElementById("multiSelectCount").textContent = String(multiSelectIds.size);
}

async function compressSelected() {
  if (multiSelectIds.size === 0) { toast("请先选择文件", "info"); return; }
  const name = prompt("压缩包名称：", `archive-${Date.now()}.zip`);
  if (!name) return;

  toast("正在压缩...", "info");
  try {
    const zip = new JSZip();
    const all = await dbAll();
    for (const id of multiSelectIds) {
      const f = all.find(x => x.id === id);
      if (!f) continue;
      let blob = f.data;
      if (f.isPrivate) {
        if (!adminKey) { toast(t("sessionExpired"), "error"); return; }
        const dec = await decryptBuf(await blob.arrayBuffer(), adminKey);
        blob = new Blob([dec]);
      }
      zip.file(f.name, blob);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Save the resulting zip into DB
    const finalName = /\.zip$/i.test(name) ? name : (name + ".zip");
    let stored = zipBlob;
    let priv = false;
    if (isAdmin && adminKey) {
      // Ask whether to encrypt the resulting zip
      priv = confirm("将压缩结果保存为加密文件？(确定=加密 / 取消=公开)");
      if (priv) {
        const enc = await encryptBuf(await zipBlob.arrayBuffer(), adminKey);
        stored = new Blob([enc]);
      }
    }
    await dbAdd({
      name: finalName,
      size: zipBlob.size,
      type: "application/zip",
      isPrivate: priv,
      uploadedAt: Date.now(),
      data: stored
    });
    toast(`已压缩 ${multiSelectIds.size} 个文件为 ${finalName}`, "success");
    toggleMultiSelect();
  } catch (e) {
    console.error("[compress] error:", e);
    toast("压缩失败: " + (e.message || e), "error");
  }
}

/* ===== FILE VIEW ===== */
async function openFileView(f) {
  try {
    let blob;
    if (f.isPrivate) {
      if (!adminKey) { toast(t("sessionExpired"), "error"); return; }
      const enc = await f.data.arrayBuffer();
      const dec = await decryptBuf(enc, adminKey);
      blob = new Blob([dec], { type: f.type });
    } else {
      blob = f.data;
    }

    const { fmt, isText } = await probeBlobFormat(blob);
    const ext = getFileExt(f.name);
    const extLooksArchive = ["zip", "cbz", "cbr", "tar", "gz", "tgz", "7z", "rar"].includes(ext);

    // Archive content: extract & render via comic reader.
    // When extension is misleading (does not declare an archive),
    // require admin privilege to perform the deep/recursive unwrap.
    if (isArchiveFormat(fmt)) {
      if (extLooksArchive || isAdmin) {
        openComicReader(blob, f.name);
        return;
      }
      toast("此文件实际为压缩包，需管理员权限解析", "info");
      // fall through to download-only path below
    }

    const modal = document.getElementById("previewModal");
    const content = document.getElementById("pvContent");
    document.getElementById("pvTitle").textContent = f.name;
    content.innerHTML = "";

    const downloadBlob = blob;
    document.getElementById("pvDownloadBtn").onclick = () => {
      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement("a"); a.href = url; a.download = f.name; a.click(); URL.revokeObjectURL(url);
    };

    if (isImageFormat(fmt) || ["png","jpg","jpeg","gif","webp","svg","bmp"].includes(ext)) {
      const img = document.createElement("img"); img.src = URL.createObjectURL(blob); content.appendChild(img);
      img.addEventListener("load", () => enableImageZoom(img, content), { once: true });
    } else if (fmt === "pdf" || ext === "pdf") {
      const iframe = document.createElement("iframe"); iframe.src = URL.createObjectURL(blob); iframe.style.cssText = "width:100%;height:55vh;border:none;border-radius:8px;"; content.appendChild(iframe);
    } else if (isText || ["txt","json","xml","js","html","css","md","log"].includes(ext)) {
      const text = await blob.text();
      const pre = document.createElement("pre"); pre.textContent = text; content.appendChild(pre);
    } else {
      content.innerHTML = `<div class="empty-placeholder" style="border:none"><p>该格式不支持预览，请直接下载</p></div>`;
    }

    modal.classList.add("active");
  } catch (e) { console.error(e); toast(t("decryptErr"), "error"); }
}

function closePreview() { document.getElementById("previewModal").classList.remove("active"); document.getElementById("pvContent").innerHTML = ""; }

/* ===== SEED DEMO DATA ===== */
async function seedIfEmpty() {
  const all = await dbAll();
  if (all.length > 0) return;

  try {
    const zip = new JSZip();
    const pages = [
      { title: "欢迎", body: "欢迎使用文档小助手" },
      { title: "翻页模式", body: "支持左右翻页 · 上下翻页 · 瀑布流" },
      { title: "感谢体验", body: "更多功能请探索管理员模式" }
    ];

    for (let i = 0; i < pages.length; i++) {
      const cv = document.createElement("canvas"); cv.width = 600; cv.height = 800;
      const cx = cv.getContext("2d");
      const g = cx.createLinearGradient(0, 0, 600, 800);
      g.addColorStop(0, "#0c1529"); g.addColorStop(1, "#050a18");
      cx.fillStyle = g; cx.fillRect(0, 0, 600, 800);
      cx.strokeStyle = "#3b82f6"; cx.lineWidth = 4;
      cx.strokeRect(20, 20, 560, 760);
      cx.fillStyle = "#3b82f6"; cx.font = "bold 28px Inter, sans-serif"; cx.textAlign = "center";
      cx.fillText(pages[i].title, 300, 200);
      cx.fillStyle = "#e8ecf4"; cx.font = "22px Inter, sans-serif";
      cx.fillText(pages[i].body, 300, 400);
      cx.fillStyle = "#4a5f82"; cx.font = "16px Inter, sans-serif";
      cx.fillText(`- ${i+1} / ${pages.length} -`, 300, 740);

      const dataUrl = cv.toDataURL("image/jpeg", 0.9);
      const bin = atob(dataUrl.split(",")[1]);
      const arr = new Uint8Array(bin.length);
      for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
      zip.file(`page_${String(i+1).padStart(3,"0")}.jpg`, arr);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    await dbAdd({ name: "漫画合集.zip", size: blob.size, type: "application/zip", isPrivate: false, uploadedAt: Date.now(), data: blob });
  } catch (e) { console.error("Seed error", e); }
}

/* ===== SECURITY SETTINGS ===== */
function updateSecuritySettingsUI() {
  const enabled = localStorage.getItem("g_startup_lock_enabled") === "true";
  const toggle = document.getElementById("enableStartupLockToggle");
  const btn = document.getElementById("setNormalLockBtn");
  
  if (toggle) toggle.checked = enabled;
  if (btn) btn.style.display = enabled ? "block" : "none";
}

function toggleStartupLock(toggle) {
  if (toggle.checked) {
    const normalHash = localStorage.getItem("g_normal_hash");
    if (!normalHash) {
      setupNormalGesture();
    } else {
      localStorage.setItem("g_startup_lock_enabled", "true");
      toast(t("gestureNormalSetOk"), "success");
      updateSecuritySettingsUI();
    }
  } else {
    localStorage.setItem("g_startup_lock_enabled", "false");
    updateSecuritySettingsUI();
  }
}

function setupNormalGesture() {
  isSettingNormalGesture = true;
  openGesture();
}

function openSettings() {
  document.getElementById("settingsDialog").classList.add("active");
  updateSecuritySettingsUI();
}

function closeSettings() {
  document.getElementById("settingsDialog").classList.remove("active");
}

/* ===== iOS external file receive (Capacitor "Open in" / share sheet) ===== */
// Legacy hook — Capacitor iOS bridge calls this directly when the app is
// launched via a document URL. Works even without @capacitor/app plugin.
window.handleOpenUrl = function (url) {
  handleIncomingFileURL(url);
};

let __iosReceivedUrls = [];

function initIOSFileReceive() {
  if (typeof window.Capacitor === "undefined") {
    console.log("[ios-receive] Capacitor not present (running in browser)");
    return;
  }
  console.log("[ios-receive] Capacitor present, plugins:", Object.keys(window.Capacitor.Plugins || {}));
  const App = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (!App) {
    console.warn("[ios-receive] @capacitor/app plugin not registered");
    return;
  }

  if (typeof App.getLaunchUrl === "function") {
    App.getLaunchUrl()
      .then(res => {
        console.log("[ios-receive] getLaunchUrl =>", res);
        if (res && res.url) handleIncomingFileURL(res.url);
      })
      .catch(err => console.warn("[ios-receive] getLaunchUrl failed", err));
  }
  if (typeof App.addListener === "function") {
    App.addListener("appUrlOpen", (data) => {
      console.log("[ios-receive] appUrlOpen =>", data);
      if (data && data.url) handleIncomingFileURL(data.url);
    });
  }
}

async function handleIncomingFileURL(url) {
  console.log("[ios-receive] handleIncomingFileURL:", url, "bootDone=", appBootDone);
  if (!url) return;
  if (__iosReceivedUrls.includes(url)) {
    console.log("[ios-receive] already processed, skip");
    return;
  }
  __iosReceivedUrls.push(url);

  // If app is still on the lock screen / not yet finished its boot flow,
  // queue the URL and drain it once admin/normal mode is established.
  if (!appBootDone) {
    console.log("[ios-receive] boot not done, queueing");
    pendingExternalUrls.push(url);
    return;
  }
  await processIncomingFileURL(url);
}

async function processIncomingFileURL(url) {
  try {
    let fileName = "received";
    try { fileName = decodeURIComponent(url.split("?")[0].split("/").pop() || fileName); } catch (_) {}
    if (typeof toast === "function") toast("收到外部文件: " + fileName);

    const webUrl = (window.Capacitor && typeof window.Capacitor.convertFileSrc === "function")
      ? window.Capacitor.convertFileSrc(url) : url;
    console.log("[ios-receive] fetching:", webUrl);
    const resp = await fetch(webUrl);
    if (!resp.ok) throw new Error("fetch failed " + resp.status);
    const blob = await resp.blob();
    console.log("[ios-receive] got blob size:", blob.size, "type:", blob.type);

    const file = new File([blob], fileName, { type: blob.type || "application/octet-stream" });
    if (typeof prepUpload === "function") {
      prepUpload(file);
    } else {
      console.error("[ios-receive] prepUpload not found");
    }
  } catch (e) {
    console.error("[ios-receive] processIncomingFileURL error:", e);
    if (typeof toast === "function") toast("接收文件失败: " + (e.message || e), "error");
  }
}

function markAppBootDone() {
  if (appBootDone) return;
  appBootDone = true;
  console.log("[ios-receive] markAppBootDone — draining", pendingExternalUrls.length, "queued URL(s)");
  // Drain queued external URLs sequentially so the choice dialog has time to show
  (async () => {
    while (pendingExternalUrls.length > 0) {
      const url = pendingExternalUrls.shift();
      // eslint-disable-next-line no-await-in-loop
      await processIncomingFileURL(url);
    }
  })();
}

/* ===== INIT ===== */
window.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  await seedIfEmpty();
  applyLang();
  initFeedback();
  initUpload();
  initBackgroundLock();
  initIOSFileReceive();
  refreshFileList();
  
  updateSecuritySettingsUI();

  const wasAdmin = sessionStorage.getItem("isAdminActive") === "true";
  const startupLock = localStorage.getItem("g_startup_lock_enabled") === "true";
  const normalHash = localStorage.getItem("g_normal_hash");
  if (wasAdmin) {
    triggerBackgroundReAuth();
  } else {
    if (startupLock && normalHash) {
      isStartupUnlock = true;
      openGesture();
    }
  }
  // If no gesture flow is required, the app is immediately ready
  // for external file processing; otherwise the gesture completion
  // handlers will call markAppBootDone().
  const overlayActive = document.getElementById("gestureOverlay")?.classList.contains("active");
  if (!wasAdmin && !overlayActive) markAppBootDone();
});
