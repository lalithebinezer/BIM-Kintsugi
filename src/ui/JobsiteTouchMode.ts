/**
 * JobsiteTouchMode — Field Tablet Touch Ergonomics & Swipe-to-Dismiss Sidebars
 *
 * Enables 44×44px WCAG/Apple HIG touch targets (`body.jobsite-touch-mode`)
 * and natural horizontal swipe-to-dismiss gestures on `.left-sidebar` and `.right-sidebar`
 * for construction site iPads and field tablets.
 */

const STORAGE_KEY = "bim_kintsugi_jobsite_touch_mode";

export class JobsiteTouchMode {
  private static instance: JobsiteTouchMode | null = null;
  private enabled = false;
  private gesturesBound = false;

  public static getInstance(): JobsiteTouchMode {
    if (!this.instance) this.instance = new JobsiteTouchMode();
    return this.instance;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public init(): void {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    const autoCoarse =
      saved === null &&
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches &&
      window.innerWidth <= 1180;

    this.setEnabled(saved === "1" || autoCoarse, false);
    this.bindSwipeGestures();
  }

  public setEnabled(next: boolean, persist = true): boolean {
    this.enabled = next;
    if (typeof document !== "undefined") {
      document.body.classList.toggle("jobsite-touch-mode", next);
    }
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore storage errors
      }
    }
    return this.enabled;
  }

  public toggle(): boolean {
    return this.setEnabled(!this.enabled, true);
  }

  private bindSwipeGestures(): void {
    if (this.gesturesBound || typeof document === "undefined") return;
    this.gesturesBound = true;

    const bindSidebarSwipe = (
      selector: string,
      direction: "left" | "right",
      bodyCollapsedClass: string
    ) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return;
      let startX = 0;
      let startY = 0;
      let tracking = false;

      el.addEventListener(
        "touchstart",
        (ev: TouchEvent) => {
          if (ev.touches.length !== 1) return;
          startX = ev.touches[0].clientX;
          startY = ev.touches[0].clientY;
          tracking = true;
        },
        { passive: true }
      );

      el.addEventListener(
        "touchend",
        (ev: TouchEvent) => {
          if (!tracking || ev.changedTouches.length === 0) return;
          tracking = false;
          const dx = ev.changedTouches[0].clientX - startX;
          const dy = Math.abs(ev.changedTouches[0].clientY - startY);
          // Dismiss only on intentional horizontal swipe (>70px and mostly horizontal)
          if (dy > 50) return;
          if (direction === "left" && dx < -70) {
            document.body.classList.add(bodyCollapsedClass);
            el.classList.remove("open");
          } else if (direction === "right" && dx > 70) {
            document.body.classList.add(bodyCollapsedClass);
            el.classList.remove("open");
          }
        },
        { passive: true }
      );
    };

    bindSidebarSwipe(".sidebar.left-sidebar", "left", "left-sidebar-collapsed");
    bindSidebarSwipe(".sidebar.right-sidebar", "right", "right-sidebar-collapsed");
  }
}
