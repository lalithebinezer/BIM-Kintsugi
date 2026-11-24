/**
 * PwaUpdateManager — Service Worker Version Detection & Zero-Stale-Cache Reload Prompt
 *
 * Monitors the active Service Worker lifecycle and shows a clean non-intrusive
 * reload banner whenever a newer GitHub Pages build is ready to activate.
 */

export function initPwaUpdateWatcher(onUpdateAvailable?: (reloadNow: () => void) => void): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  navigator.serviceWorker.getRegistration().then((reg) => {
    if (!reg) return;

    const notifyWaiting = (worker: ServiceWorker | null) => {
      if (!worker) return;
      const reloadNow = () => {
        worker.postMessage({ type: "SKIP_WAITING" });
      };
      if (onUpdateAvailable) {
        onUpdateAvailable(reloadNow);
      } else {
        showDefaultUpdateBanner(reloadNow);
      }
    };

    if (reg.waiting) {
      notifyWaiting(reg.waiting);
    }

    reg.addEventListener("updatefound", () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          notifyWaiting(installing);
        }
      });
    });
  }).catch(() => {
    // Ignore SW errors in private browsing or localhost dev mode
  });
}

function showDefaultUpdateBanner(reloadNow: () => void): void {
  if (document.getElementById("pwa-update-banner")) return;
  const banner = document.createElement("div");
  banner.id = "pwa-update-banner";
  banner.style.cssText =
    "position:fixed;bottom:18px;right:18px;z-index:10090;display:flex;align-items:center;gap:0.65rem;padding:0.6rem 0.9rem;border-radius:10px;background:var(--studio-glass-elevated,#12141c);border:1px solid var(--accent-500,#d4ff3f);color:var(--text-primary,#f8fafc);box-shadow:0 12px 32px rgba(0,0,0,0.45);font-size:0.75rem;font-weight:600;";
  banner.innerHTML = `
    <span>New BIM Kintsugi version ready</span>
    <button type="button" id="btn-pwa-reload-now" class="btn-primary" style="font-size:0.7rem;padding:0.25rem 0.6rem;">Reload</button>
    <button type="button" id="btn-pwa-dismiss" class="btn-secondary" style="font-size:0.7rem;padding:0.2rem 0.45rem;">✕</button>
  `;
  document.body.appendChild(banner);
  banner.querySelector("#btn-pwa-reload-now")?.addEventListener("click", reloadNow);
  banner.querySelector("#btn-pwa-dismiss")?.addEventListener("click", () => banner.remove());
}
