/**
 * PwaUpdateManager — Service Worker Version Detection & User-Controlled Reload Prompt
 *
 * Monitors the active Service Worker lifecycle and shows a clean non-intrusive
 * reload banner whenever a newer GitHub Pages build is waiting to activate.
 * Never triggers an automatic reload on first-visit SW claim or unsolicited
 * controllerchange events — eliminating the double-load on startup.
 */

let watcherInitialized = false;

export function initPwaUpdateWatcher(
  onUpdateAvailable?: (reloadNow: () => void) => void,
  existingRegistration?: ServiceWorkerRegistration,
  reloadFn: () => void = () => window.location.reload()
): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  const hadControllerAtBoot = Boolean(navigator.serviceWorker.controller);
  let userRequestedReload = false;
  let refreshing = false;

  if (!watcherInitialized) {
    watcherInitialized = true;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Only reload if a previous SW was already controlling the page AND the user clicked Reload.
      // First-visit SW claim (hadControllerAtBoot === false) must never reload the page.
      if (!hadControllerAtBoot || !userRequestedReload || refreshing) return;
      refreshing = true;
      reloadFn();
    });
  }

  const attachRegistration = (reg: ServiceWorkerRegistration | undefined) => {
    if (!reg) return;

    const notifyWaiting = (worker: ServiceWorker | null) => {
      if (!worker) return;
      const reloadNow = () => {
        userRequestedReload = true;
        worker.postMessage({ type: "SKIP_WAITING" });
      };
      if (onUpdateAvailable) {
        onUpdateAvailable(reloadNow);
      } else {
        showDefaultUpdateBanner(reloadNow);
      }
    };

    if (reg.waiting && navigator.serviceWorker.controller) {
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
  };

  if (existingRegistration) {
    attachRegistration(existingRegistration);
    return;
  }

  navigator.serviceWorker
    .getRegistration()
    .then(attachRegistration)
    .catch(() => {
      // Ignore SW errors in private browsing or localhost dev mode
    });
}

/** Test-only helper to reset singleton listener guard between unit tests. */
export function resetPwaUpdateWatcherForTest(): void {
  watcherInitialized = false;
}

function showDefaultUpdateBanner(reloadNow: () => void): void {
  if (document.getElementById("pwa-update-banner")) return;
  const banner = document.createElement("div");
  banner.id = "pwa-update-banner";
  banner.style.cssText =
    "position:fixed;bottom:18px;right:18px;z-index:var(--bk-z-toast,100020);display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:var(--bk-r-lg,12px);background:var(--bk-surface-glass,#12141c);backdrop-filter:blur(18px);border:1px solid var(--bk-accent-border,#d4ff3f);color:var(--bk-text,#f8fafc);box-shadow:var(--bk-shadow-pop,0 12px 32px rgba(0,0,0,0.45));font-size:var(--bk-text-sm,12px);font-weight:600;";
  banner.innerHTML = `
    <span>New BIM Kintsugi version ready</span>
    <button type="button" id="btn-pwa-reload-now" class="bk-btn bk-btn--primary bk-btn--xs">Reload</button>
    <button type="button" id="btn-pwa-dismiss" class="bk-btn bk-btn--ghost bk-btn--xs bk-btn--icon" aria-label="Dismiss update notification">✕</button>
  `;
  document.body.appendChild(banner);
  banner.querySelector("#btn-pwa-reload-now")?.addEventListener("click", reloadNow);
  banner.querySelector("#btn-pwa-dismiss")?.addEventListener("click", () => banner.remove());
}
