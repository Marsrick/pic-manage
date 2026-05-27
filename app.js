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
  if (ext === "zip" || ext === "cbz" || ext === "7z" || ext === "tar") return "comic";
  if (["txt","json","xml","js","html","css","md"].includes(ext)) return "doc";
  return "other";
}

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
    const pub = all.filter(f => !f.isPrivate);
    updateCategoryCounts(isAdmin ? all : pub);

    let filtered = isAdmin ? all : pub;
    if (currentFilter !== "all") {
      filtered = filtered.filter(f => getFileCat(f.name) === currentFilter);
    }

    // Search filtering
    const q = document.getElementById("searchInput").value.trim().toLowerCase();
    if (q) filtered = filtered.filter(f => f.name.toLowerCase().includes(q));

    if (filtered.length === 0) {
      area.innerHTML = `<div class="empty-placeholder"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg><p>${t("emptyFiles")}</p></div>`;
      return;
    }

    area.innerHTML = filtered.map(f => renderFileRow(f, isAdmin)).join("");
    bindFileRowEvents(area);
  } catch (e) { console.error(e); }
}

function renderFileRow(f, showLock) {
  const ext = getFileExt(f.name);
  const iconCls = getIconClass(f.name);
  const lockBadge = (showLock && f.isPrivate) ? `<div class="file-lock-badge"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75"/></svg></div>` : "";

  return `
    <div class="file-row" data-id="${f.id}" data-name="${f.name}">
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
        ${isAdmin ? `<button class="file-action-btn danger del-btn" title="删除"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg></button>` : ""}
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
  area.querySelectorAll(".del-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      e.stopPropagation();
      const id = Number(btn.closest(".file-row").dataset.id);
      if (confirm(t("confirmDel"))) { await dbDel(id); toast(t("deleteOk"), "success"); refreshFileList(); }
    });
  });
  area.querySelectorAll(".file-row").forEach(row => {
    row.addEventListener("click", async () => {
      const id = Number(row.dataset.id);
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
  sessionStorage.setItem("isAdminActive", "true");
  document.getElementById("adminBadge").style.display = "flex";
  document.getElementById("logoutAdminBtn").style.display = "";
  switchNav("viewFiles", null);
  refreshFileList();
}

function logoutAdmin() {
  isAdmin = false; adminKey = null;
  sessionStorage.removeItem("isAdminActive");
  document.getElementById("adminBadge").style.display = "none";
  document.getElementById("logoutAdminBtn").style.display = "none";
  switchNav("viewFiles", null);
  refreshFileList();
  toast(t("adminLogout"), "info");
}

/* ===== BACKGROUND LOCK (visibilitychange, pause/resume, pagehide/pageshow) ===== */
let backgroundReAuth = false; // Flag: we are in re-authentication mode after background resume

function handleAppBackground() {
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

  const wasAdmin = sessionStorage.getItem("isAdminActive") === "true";
  const startupLock = localStorage.getItem("g_startup_lock_enabled") === "true";

  if (wasAdmin || startupLock) {
    const adminHash = localStorage.getItem("g_hash");
    const normalHash = localStorage.getItem("g_normal_hash");

    if (adminHash || normalHash) {
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
    }
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

/* ===== UPLOAD ===== */
function initUpload() {
  const zone = document.getElementById("uploadArea");
  const input = document.getElementById("fileInput");

  zone.addEventListener("click", () => input.click());
  zone.addEventListener("dragover", e => { e.preventDefault(); zone.style.borderColor = "var(--accent-blue)"; });
  zone.addEventListener("dragleave", () => { zone.style.borderColor = ""; });
  zone.addEventListener("drop", e => { e.preventDefault(); zone.style.borderColor = ""; if (e.dataTransfer.files[0]) prepUpload(e.dataTransfer.files[0]); });
  input.addEventListener("change", e => { if (e.target.files[0]) prepUpload(e.target.files[0]); });
}

function prepUpload(file) {
  if (file.size > 50 * 1024 * 1024) { toast(t("fileTooLarge"), "error"); return; }
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

    const headerBytes = new Uint8Array(await blob.slice(0, 262).arrayBuffer());
    let isDetectedArchive = false;
    if (headerBytes.length >= 4 && headerBytes[0] === 0x50 && headerBytes[1] === 0x4B && headerBytes[2] === 0x03 && headerBytes[3] === 0x04) {
      isDetectedArchive = true;
    } else if (headerBytes.length >= 6 && headerBytes[0] === 0x37 && headerBytes[1] === 0x7A && headerBytes[2] === 0xBC && headerBytes[3] === 0xAF && headerBytes[4] === 0x27 && headerBytes[5] === 0x1C) {
      isDetectedArchive = true;
    } else if (headerBytes.length >= 2 && headerBytes[0] === 0x1F && headerBytes[1] === 0x8B) {
      isDetectedArchive = true;
    } else if (headerBytes.length >= 262) {
      const ustar = String.fromCharCode(...headerBytes.slice(257, 262));
      if (ustar === "ustar") {
        isDetectedArchive = true;
      }
    }

    const ext = getFileExt(f.name);
    if (isDetectedArchive || ["zip", "cbz", "tar", "gz", "tgz", "7z"].includes(ext)) {
      openComicReader(blob, f.name);
      return;
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

    if (["png","jpg","jpeg","gif","webp","svg","bmp"].includes(ext)) {
      const img = document.createElement("img"); img.src = URL.createObjectURL(blob); content.appendChild(img);
    } else if (["txt","json","xml","js","html","css","md"].includes(ext)) {
      const text = await blob.text(); const pre = document.createElement("pre"); pre.textContent = text; content.appendChild(pre);
    } else if (ext === "pdf") {
      const iframe = document.createElement("iframe"); iframe.src = URL.createObjectURL(blob); iframe.style.cssText = "width:100%;height:55vh;border:none;border-radius:8px;"; content.appendChild(iframe);
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

/* ===== INIT ===== */
window.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  await seedIfEmpty();
  applyLang();
  initFeedback();
  initUpload();
  initBackgroundLock();
  refreshFileList();
  
  updateSecuritySettingsUI();

  const wasAdmin = sessionStorage.getItem("isAdminActive") === "true";
  if (wasAdmin) {
    triggerBackgroundReAuth();
  } else {
    const startupLock = localStorage.getItem("g_startup_lock_enabled") === "true";
    const normalHash = localStorage.getItem("g_normal_hash");
    if (startupLock && normalHash) {
      isStartupUnlock = true;
      openGesture();
    }
  }
});
