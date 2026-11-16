export type PointerPriority = "gizmo" | "marquee" | "measurement" | "clipper" | "picking";

export interface PointerHandlerRegistration {
  id: string;
  priority: PointerPriority;
  isActive: () => boolean;
  onPointerDown?: (e: PointerEvent) => boolean | void;
  onPointerMove?: (e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent, isClickWithinDeadzone: boolean) => void;
}

const PRIORITY_ORDER: Record<PointerPriority, number> = {
  gizmo: 100,
  marquee: 80,
  measurement: 60,
  clipper: 40,
  picking: 20,
};

/**
 * Unified mouse/touch pointer arbiter for the 3D canvas:
 * - Enforces drag deadzone thresholds (`dragDeadzonePx`) so camera orbit drags never trigger clicks.
 * - Uses `setPointerCapture` on active drags and tracks multi-touch active pointer count cleanly.
 * - Coalesces high-frequency `pointermove` callbacks via `requestAnimationFrame` (max 1 raycast per frame).
 */
export class PointerInputArbiter {
  private static instance: PointerInputArbiter | null = null;
  private container: HTMLElement | null = null;
  private handlers: Map<string, PointerHandlerRegistration> = new Map();
  private activePointers: Map<number, { startX: number; startY: number }> = new Map();
  private claimedOwnerId: string | null = null;
  private dragDeadzonePx: number = 5;

  private pendingMoveEvent: PointerEvent | null = null;
  private moveRafId: number | null = null;
  private bound: boolean = false;

  private constructor() {}

  public static getInstance(): PointerInputArbiter {
    if (!PointerInputArbiter.instance) {
      PointerInputArbiter.instance = new PointerInputArbiter();
    }
    return PointerInputArbiter.instance;
  }

  public setDragDeadzone(px: number) {
    if (px >= 1 && px <= 32) {
      this.dragDeadzonePx = px;
    }
  }

  public attach(container: HTMLElement | null | undefined) {
    if (!container || this.bound || typeof container.addEventListener !== "function") return;
    this.container = container;
    this.bound = true;

    container.addEventListener("pointerdown", this.handlePointerDown, { passive: false });
    if (typeof window !== "undefined") {
      window.addEventListener("pointermove", this.handlePointerMove, { passive: true });
      window.addEventListener("pointerup", this.handlePointerUp, { passive: true });
      window.addEventListener("pointercancel", this.handlePointerCancel, { passive: true });
    }
  }

  public registerHandler(reg: PointerHandlerRegistration): () => void {
    this.handlers.set(reg.id, reg);
    return () => {
      this.handlers.delete(reg.id);
      if (this.claimedOwnerId === reg.id) {
        this.claimedOwnerId = null;
      }
    };
  }

  public getActiveTouchCount(): number {
    return this.activePointers.size;
  }

  public isClickWithinDeadzone(pointerId: number, clientX: number, clientY: number): boolean {
    const start = this.activePointers.get(pointerId);
    if (!start) return true;
    const dx = clientX - start.startX;
    const dy = clientY - start.startY;
    return Math.hypot(dx, dy) <= this.dragDeadzonePx;
  }

  private getSortedActiveHandlers(): PointerHandlerRegistration[] {
    return Array.from(this.handlers.values())
      .filter((h) => h.isActive())
      .sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
  }

  private handlePointerDown = (e: PointerEvent) => {
    this.activePointers.set(e.pointerId, { startX: e.clientX, startY: e.clientY });

    // Multi-touch gesture (pinch/two-finger pan): release single-tool claim so camera controls can act
    if (this.activePointers.size > 1) {
      this.claimedOwnerId = null;
      return;
    }

    for (const h of this.getSortedActiveHandlers()) {
      const consumed = h.onPointerDown?.(e);
      if (consumed === true) {
        this.claimedOwnerId = h.id;
        try {
          this.container?.setPointerCapture?.(e.pointerId);
        } catch {}
        break;
      }
    }
  };

  private handlePointerMove = (e: PointerEvent) => {
    this.pendingMoveEvent = e;
    if (this.moveRafId !== null) return;

    const schedule =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16) as unknown as number;

    this.moveRafId = schedule(() => {
      this.moveRafId = null;
      const latest = this.pendingMoveEvent;
      this.pendingMoveEvent = null;
      if (!latest || this.activePointers.size > 1) return;

      if (this.claimedOwnerId) {
        const owner = this.handlers.get(this.claimedOwnerId);
        if (owner?.isActive()) {
          owner.onPointerMove?.(latest);
        }
        return;
      }

      for (const h of this.getSortedActiveHandlers()) {
        h.onPointerMove?.(latest);
      }
    });
  };

  private handlePointerUp = (e: PointerEvent) => {
    const withinDeadzone = this.isClickWithinDeadzone(e.pointerId, e.clientX, e.clientY);
    this.activePointers.delete(e.pointerId);

    try {
      if (this.container?.hasPointerCapture?.(e.pointerId)) {
        this.container.releasePointerCapture(e.pointerId);
      }
    } catch {}

    if (this.claimedOwnerId) {
      const owner = this.handlers.get(this.claimedOwnerId);
      this.claimedOwnerId = null;
      owner?.onPointerUp?.(e, withinDeadzone);
      return;
    }

    for (const h of this.getSortedActiveHandlers()) {
      h.onPointerUp?.(e, withinDeadzone);
    }
  };

  private handlePointerCancel = (e: PointerEvent) => {
    this.activePointers.delete(e.pointerId);
    this.claimedOwnerId = null;
    try {
      if (this.container?.hasPointerCapture?.(e.pointerId)) {
        this.container.releasePointerCapture(e.pointerId);
      }
    } catch {}
  };

  public dispose() {
    if (!this.bound) return;
    this.bound = false;
    this.container?.removeEventListener("pointerdown", this.handlePointerDown);
    if (typeof window !== "undefined") {
      window.removeEventListener("pointermove", this.handlePointerMove);
      window.removeEventListener("pointerup", this.handlePointerUp);
      window.removeEventListener("pointercancel", this.handlePointerCancel);
    }
    this.handlers.clear();
    this.activePointers.clear();
    this.claimedOwnerId = null;
  }
}
