import * as THREE from "three";

export class BimViewCube extends HTMLElement {
  private _camera: THREE.Camera | null = null;
  private cubeElement: HTMLDivElement;

  private isDraggingCube = false;
  private startPointerX = 0;
  private startPointerY = 0;
  private hasDraggedCube = false;
  private clickedFace: string | null = null;
  public mouseSensitivity = 1.0;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 88px;
          height: 88px;
          perspective: 450px;
          z-index: 99;
          pointer-events: auto;
          user-select: none;
        }

        .view-cube-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-cube-home {
          position: absolute;
          top: -4px;
          left: -4px;
          width: 22px;
          height: 22px;
          background: var(--bg-card, rgba(20, 24, 35, 0.85));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
          border-radius: 6px;
          color: var(--text-muted, #94a3b8);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transform: scale(0.85);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 100;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        :host(:hover) .btn-cube-home {
          opacity: 1;
          transform: scale(1);
        }

        .btn-cube-home:hover {
          background: var(--accent-500, #D4FF3F);
          color: var(--accent-btn-text, #000000);
          border-color: var(--accent-400, #D4FF3F);
          box-shadow: 0 0 12px var(--accent-glow, rgba(212, 255, 63, 0.4));
        }

        .view-cube-container {
          width: 60px;
          height: 60px;
          transform-style: preserve-3d;
          cursor: grab;
          position: relative;
        }

        .view-cube-container:active {
          cursor: grabbing;
        }

        .view-cube {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        }

        .cube-face {
          position: absolute;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, rgba(30, 36, 52, 0.95), rgba(15, 20, 30, 0.95));
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 5px;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          user-select: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 4px 10px rgba(0, 0, 0, 0.35);
          transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .cube-face:hover {
          background: var(--accent-500, #D4FF3F);
          border-color: var(--accent-500, #D4FF3F);
          color: #000000;
          cursor: pointer;
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.6), 0 0 16px var(--accent-glow, rgba(212, 255, 63, 0.5));
        }

        .cube-front  { transform: rotateY(  0deg) translateZ(30px); }
        .cube-back   { transform: rotateY(180deg) translateZ(30px); }
        .cube-left   { transform: rotateY(-90deg) translateZ(30px); }
        .cube-right  { transform: rotateY( 90deg) translateZ(30px); }
        .cube-top    { transform: rotateX( 90deg) translateZ(30px); }
        .cube-bottom { transform: rotateX(-90deg) translateZ(30px); }

        /* 3D Integrated Compass Ring at Cube Base */
        .compass-ring-3d {
          position: absolute;
          width: 86px;
          height: 86px;
          top: -13px;
          left: -13px;
          transform: rotateX(90deg) translateZ(-33px);
          transform-style: preserve-3d;
          border: 1.5px dashed rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          pointer-events: auto;
          box-shadow: 0 0 12px rgba(0, 0, 0, 0.4);
        }

        .compass-cardinal {
          position: absolute;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif;
          font-size: 0.55rem;
          font-weight: 900;
          color: #cbd5e1;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.1rem 0.28rem;
          border-radius: 4px;
          line-height: 1;
          cursor: pointer;
          transition: all 0.15s;
        }

        .compass-cardinal:hover {
          background: var(--accent-500, #D4FF3F);
          color: #000000;
          border-color: #ffffff;
          transform: scale(1.15);
        }

        /* Cardinal points on the 3D ground ring */
        .cardinal-n {
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          color: var(--accent-500, #D4FF3F);
          border-color: var(--accent-500, #D4FF3F);
        }
        .cardinal-s {
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
        }
        .cardinal-e {
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
        }
        .cardinal-w {
          left: -8px;
          top: 50%;
          transform: translateY(-50%);
        }
      </style>
      <div class="view-cube-wrapper">
        <button class="btn-cube-home" id="btn-cube-home" title="Reset to Isometric Home View">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>

        <div class="view-cube-container">
          <div class="view-cube" id="view-cube">
            <!-- 3D Ground Compass Ring -->
            <div class="compass-ring-3d">
              <span class="compass-cardinal cardinal-n" data-cardinal="north" title="Align View to North">N</span>
              <span class="compass-cardinal cardinal-e" data-cardinal="east" title="Align View to East">E</span>
              <span class="compass-cardinal cardinal-s" data-cardinal="south" title="Align View to South">S</span>
              <span class="compass-cardinal cardinal-w" data-cardinal="west" title="Align View to West">W</span>
            </div>

            <!-- Cube 6 Principal Faces -->
            <div class="cube-face cube-front" data-face="front">FRONT</div>
            <div class="cube-face cube-back" data-face="back">BACK</div>
            <div class="cube-face cube-left" data-face="left">LEFT</div>
            <div class="cube-face cube-right" data-face="right">RIGHT</div>
            <div class="cube-face cube-top" data-face="top">TOP</div>
            <div class="cube-face cube-bottom" data-face="bottom">BOTTOM</div>
          </div>
        </div>
      </div>
    `;

    this.cubeElement = this.shadowRoot!.getElementById("view-cube") as HTMLDivElement;
    this.setupEvents();
  }

  set camera(cam: THREE.Camera | null) {
    this._camera = cam;
    this.updateOrientation();
  }

  get camera() {
    return this._camera;
  }

  public updateOrientation() {
    if (!this._camera) return;

    this._camera.updateMatrixWorld(true);
    const matrix = new THREE.Matrix4();
    matrix.extractRotation(this._camera.matrixWorldInverse);

    const e = matrix.elements;
    this.cubeElement.style.transform = `matrix3d(
      ${e[0].toFixed(6)}, ${-e[1].toFixed(6)}, ${e[2].toFixed(6)}, 0,
      ${-e[4].toFixed(6)}, ${e[5].toFixed(6)}, ${-e[6].toFixed(6)}, 0,
      ${e[8].toFixed(6)}, ${-e[9].toFixed(6)}, ${e[10].toFixed(6)}, 0,
      0, 0, 0, 1
    )`;
  }

  private setupEvents() {
    const container = this.shadowRoot!.querySelector(".view-cube-container") as HTMLDivElement;
    const homeBtn = this.shadowRoot!.getElementById("btn-cube-home");

    if (homeBtn) {
      homeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent("homeclick"));
      });
    }

    container.addEventListener("pointerdown", (e: PointerEvent) => {
      const faceEl = (e.target as HTMLElement).closest(".cube-face");
      const cardinalEl = (e.target as HTMLElement).closest(".compass-cardinal");

      if (cardinalEl) {
        const cardinal = cardinalEl.getAttribute("data-cardinal");
        if (cardinal) {
          this.dispatchEvent(new CustomEvent("cardinalclick", { detail: { cardinal } }));
          return;
        }
      }

      this.clickedFace = faceEl ? faceEl.getAttribute("data-face") : null;
      
      this.isDraggingCube = true;
      this.hasDraggedCube = false;
      this.startPointerX = e.clientX;
      this.startPointerY = e.clientY;
      container.setPointerCapture(e.pointerId);
    });

    container.addEventListener("pointermove", (e: PointerEvent) => {
      if (!this.isDraggingCube) return;
      const dx = e.clientX - this.startPointerX;
      const dy = e.clientY - this.startPointerY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this.hasDraggedCube = true;
      }
      
      const speed = this.mouseSensitivity * 0.005; 
      
      this.dispatchEvent(new CustomEvent("drag", {
        detail: { dx: -dx * speed, dy: -dy * speed }
      }));
      
      this.startPointerX = e.clientX;
      this.startPointerY = e.clientY;
    });

    container.addEventListener("pointerup", (e: PointerEvent) => {
      if (this.isDraggingCube) {
        this.isDraggingCube = false;
        try { container.releasePointerCapture(e.pointerId); } catch (_) {}
        
        if (!this.hasDraggedCube && this.clickedFace) {
          this.dispatchEvent(new CustomEvent(`${this.clickedFace}click`));
        }
      }
      this.clickedFace = null;
    });

    container.addEventListener("pointercancel", (e: PointerEvent) => {
      if (this.isDraggingCube) {
        this.isDraggingCube = false;
        try { container.releasePointerCapture(e.pointerId); } catch (_) {}
      }
      this.clickedFace = null;
    });
  }
}

customElements.define("bim-view-cube", BimViewCube);
