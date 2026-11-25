/**
 * MobileWalkthroughControls — Dual-Thumb Touch Joystick & Look Pad for First-Person BIM Walkthrough
 *
 * Automatically reveals when `body.walkthrough-active` is set by `GeoEngineeringSuite.startWalkthrough()`.
 * Feeds smooth analog forward/strafe/vertical vectors into `GeoEngineeringSuite.setTouchMoveInput()`
 * and right-side look deltas into `GeoEngineeringSuite.addLookDelta()`.
 */

export interface WalkthroughTarget {
  walkActive: boolean;
  setTouchMoveInput: (forward: number, right: number, vertical?: number) => void;
  addLookDelta: (dx: number, dy: number) => void;
  stopWalkthrough: () => void;
}

export class MobileWalkthroughControls {
  private static instance: MobileWalkthroughControls | null = null;
  private hudEl: HTMLElement | null = null;
  private knobEl: HTMLElement | null = null;
  private getTarget: () => WalkthroughTarget | null;
  private stickTouchId: number | null = null;
  private lookTouchId: number | null = null;
  private lookLastX = 0;
  private lookLastY = 0;
  private stickOriginX = 0;
  private stickOriginY = 0;
  private verticalInput = 0;
  private forwardInput = 0;
  private rightInput = 0;

  private constructor(getTarget: () => WalkthroughTarget | null) {
    this.getTarget = getTarget;
    this.mount();
  }

  public static init(getTarget: () => WalkthroughTarget | null): MobileWalkthroughControls {
    if (!MobileWalkthroughControls.instance) {
      MobileWalkthroughControls.instance = new MobileWalkthroughControls(getTarget);
    } else {
      MobileWalkthroughControls.instance.getTarget = getTarget;
    }
    return MobileWalkthroughControls.instance;
  }

  public static resetForTest(): void {
    MobileWalkthroughControls.instance?.destroy();
    MobileWalkthroughControls.instance = null;
  }

  public destroy(): void {
    this.hudEl?.remove();
    this.hudEl = null;
    this.knobEl = null;
  }

  private pushInput(): void {
    this.getTarget()?.setTouchMoveInput(this.forwardInput, this.rightInput, this.verticalInput);
  }

  private mount(): void {
    if (typeof document === "undefined") return;
    if (document.getElementById("mob-walk-hud")) {
      this.hudEl = document.getElementById("mob-walk-hud");
      this.knobEl = document.getElementById("mob-walk-knob");
      return;
    }

    const hud = document.createElement("div");
    hud.id = "mob-walk-hud";
    hud.className = "mob-walk-hud bk-mobile-only";
    hud.setAttribute("role", "region");
    hud.setAttribute("aria-label", "Mobile First-Person Walkthrough Controls");
    hud.innerHTML = `
      <div class="mob-walk-topbar">
        <span class="mob-walk-badge">🚶 Walkthrough</span>
        <div class="mob-walk-elev-group">
          <button type="button" class="mob-walk-btn" id="mob-walk-up" aria-label="Move Up">↑</button>
          <button type="button" class="mob-walk-btn" id="mob-walk-down" aria-label="Move Down">↓</button>
          <button type="button" class="mob-walk-btn mob-walk-exit" id="mob-walk-exit" aria-label="Exit Walkthrough">Exit ✕</button>
        </div>
      </div>
      <div class="mob-walk-look-pad" id="mob-walk-look-pad" aria-label="Drag to look around">
        <span class="mob-walk-look-hint">Drag to Look</span>
      </div>
      <div class="mob-walk-stick-pad" id="mob-walk-stick-pad" aria-label="Virtual movement joystick">
        <div class="mob-walk-stick-ring">
          <div class="mob-walk-knob" id="mob-walk-knob"></div>
        </div>
      </div>
    `;

    const parent = document.querySelector(".ui-layer") || document.body;
    parent.appendChild(hud);
    this.hudEl = hud;
    this.knobEl = hud.querySelector<HTMLElement>("#mob-walk-knob");

    const stickPad = hud.querySelector<HTMLElement>("#mob-walk-stick-pad");
    const lookPad = hud.querySelector<HTMLElement>("#mob-walk-look-pad");
    const maxRadius = 38;

    const resetStick = () => {
      this.stickTouchId = null;
      this.forwardInput = 0;
      this.rightInput = 0;
      if (this.knobEl) this.knobEl.style.transform = "translate3d(0px, 0px, 0px)";
      this.pushInput();
    };

    const updateStick = (clientX: number, clientY: number) => {
      const dx = clientX - this.stickOriginX;
      const dy = clientY - this.stickOriginY;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);
      const nx = dist > 0 ? Math.cos(angle) * clamped : 0;
      const ny = dist > 0 ? Math.sin(angle) * clamped : 0;
      if (this.knobEl) {
        this.knobEl.style.transform = `translate3d(${nx.toFixed(1)}px, ${ny.toFixed(1)}px, 0px)`;
      }
      this.rightInput = nx / maxRadius;
      this.forwardInput = -ny / maxRadius;
      this.pushInput();
    };

    stickPad?.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      stickPad.setPointerCapture?.(ev.pointerId);
      this.stickTouchId = ev.pointerId;
      const rect = stickPad.getBoundingClientRect();
      this.stickOriginX = rect.left + rect.width / 2;
      this.stickOriginY = rect.top + rect.height / 2;
      updateStick(ev.clientX, ev.clientY);
    });
    stickPad?.addEventListener("pointermove", (ev) => {
      if (this.stickTouchId !== ev.pointerId) return;
      ev.preventDefault();
      updateStick(ev.clientX, ev.clientY);
    });
    stickPad?.addEventListener("pointerup", (ev) => {
      if (this.stickTouchId === ev.pointerId) resetStick();
    });
    stickPad?.addEventListener("pointercancel", (ev) => {
      if (this.stickTouchId === ev.pointerId) resetStick();
    });

    lookPad?.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      lookPad.setPointerCapture?.(ev.pointerId);
      this.lookTouchId = ev.pointerId;
      this.lookLastX = ev.clientX;
      this.lookLastY = ev.clientY;
    });
    lookPad?.addEventListener("pointermove", (ev) => {
      if (this.lookTouchId !== ev.pointerId) return;
      ev.preventDefault();
      const dx = ev.clientX - this.lookLastX;
      const dy = ev.clientY - this.lookLastY;
      this.lookLastX = ev.clientX;
      this.lookLastY = ev.clientY;
      this.getTarget()?.addLookDelta(dx, dy);
    });
    const endLook = (ev: PointerEvent) => {
      if (this.lookTouchId === ev.pointerId) this.lookTouchId = null;
    };
    lookPad?.addEventListener("pointerup", endLook);
    lookPad?.addEventListener("pointercancel", endLook);

    const bindHoldBtn = (selector: string, val: number) => {
      const btn = hud.querySelector<HTMLButtonElement>(selector);
      if (!btn) return;
      const down = (ev: Event) => {
        ev.preventDefault();
        this.verticalInput = val;
        this.pushInput();
      };
      const up = () => {
        if (this.verticalInput === val) {
          this.verticalInput = 0;
          this.pushInput();
        }
      };
      btn.addEventListener("pointerdown", down);
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointercancel", up);
      btn.addEventListener("pointerleave", up);
    };
    bindHoldBtn("#mob-walk-up", 1);
    bindHoldBtn("#mob-walk-down", -1);

    hud.querySelector("#mob-walk-exit")?.addEventListener("click", () => {
      resetStick();
      this.verticalInput = 0;
      const t = this.getTarget();
      if (t?.walkActive) {
        t.stopWalkthrough();
      } else {
        document.body.classList.remove("walkthrough-active");
      }
    });
  }
}
