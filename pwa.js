(function initPWA() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.warn("[pwa] Service worker registration failed:", error);
    });
  });
})();
