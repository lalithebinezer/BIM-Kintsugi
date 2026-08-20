import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";
import { ClippingModule } from "./ClippingModule";

export class SectionPlaneGizmo {
  private static instance: SectionPlaneGizmo;
  private engine: BimEngine;
  private clippingModule: ClippingModule;

  private gizmoRoot: THREE.Group;
  private activePlane: any | null = null;
  private isDragging: boolean = false;
  private isHovered: boolean = false;

  // Visual sub-elements
  private centerDisc!: THREE.Mesh;
  private centerSphere!: THREE.Mesh;
  private arrowShaftPos!: THREE.Mesh;
  private arrowConePos!: THREE.Mesh;
  private arrowShaftNeg!: THREE.Mesh;
  private arrowConeNeg!: THREE.Mesh;
  private cornerHandles: THREE.Mesh[] = [];
  private edgeHandles: THREE.Mesh[] = [];
  private frameLines!: THREE.LineSegments;

  // Interactive hitboxes
  private interactiveHitboxes: THREE.Mesh[] = [];

  // Shared Materials
  private handleMaterial: THREE.MeshBasicMaterial;
  private arrowMaterial: THREE.MeshBasicMaterial;
  private discMaterial: THREE.MeshBasicMaterial;
  private frameMaterial: THREE.LineBasicMaterial;
  private hoverMaterial: THREE.MeshBasicMaterial;

  // Drag calculation state
  private initialPlaneOrigin: THREE.Vector3 = new THREE.Vector3();
  private planeNormal: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private dragStartParam: number = 0;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouseVec: THREE.Vector2 = new THREE.Vector2();

  // Floating live HUD tooltip
  private tooltipEl: HTMLElement | null = null;
  private animFrameId: number | null = null;

  constructor() {
    this.engine = BimEngine.getInstance();
    this.clippingModule = ClippingModule.getInstance();

    this.gizmoRoot = new THREE.Group();
    this.gizmoRoot.name = "SectionPlaneGizmo_Root";
    this.gizmoRoot.renderOrder = 99999;
    this.gizmoRoot.visible = false;

    // Materials setup with depthTest disabled for clear visibility over 3D BIM models
    const defaultColor = new THREE.Color(0xd4ff3f);
    this.handleMaterial = new THREE.MeshBasicMaterial({
      color: defaultColor,
      depthTest: false,
      transparent: true,
      opacity: 0.95,
    });
    this.arrowMaterial = new THREE.MeshBasicMaterial({
      color: defaultColor,
      depthTest: false,
      transparent: true,
      opacity: 0.95,
    });
    this.discMaterial = new THREE.MeshBasicMaterial({
      color: defaultColor,
      depthTest: false,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    this.frameMaterial = new THREE.LineBasicMaterial({
      color: defaultColor,
      linewidth: 2,
      depthTest: false,
      transparent: true,
      opacity: 0.85,
    });
    this.hoverMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthTest: false,
      transparent: true,
      opacity: 1.0,
    });

    this.buildGizmoGeometry();
    this.initTooltipDOM();
    this.bindEvents();

    if (this.engine.world?.scene?.three) {
      this.engine.world.scene.three.add(this.gizmoRoot);
    }

    this.startRenderLoop();
  }

  public static getInstance(): SectionPlaneGizmo {
    if (!SectionPlaneGizmo.instance) {
      SectionPlaneGizmo.instance = new SectionPlaneGizmo();
    }
    return SectionPlaneGizmo.instance;
  }

  private buildGizmoGeometry() {
    // 1. Center Grab Disc & Core
    const discGeom = new THREE.RingGeometry(0.08, 0.75, 32);
    this.centerDisc = new THREE.Mesh(discGeom, this.discMaterial);
    this.centerDisc.renderOrder = 99999;
    this.gizmoRoot.add(this.centerDisc);

    const sphereGeom = new THREE.SphereGeometry(0.24, 16, 16);
    this.centerSphere = new THREE.Mesh(sphereGeom, this.handleMaterial);
    this.centerSphere.renderOrder = 100000;
    this.gizmoRoot.add(this.centerSphere);

    // Center interactive hitbox
    const centerHitboxGeom = new THREE.SphereGeometry(0.85, 12, 12);
    const centerHitbox = new THREE.Mesh(
      centerHitboxGeom,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    centerHitbox.userData = { isGizmo: true, type: "center" };
    this.gizmoRoot.add(centerHitbox);
    this.interactiveHitboxes.push(centerHitbox);

    // 2. Normal Translation Arrow (+Z direction in local space)
    const shaftGeom = new THREE.CylinderGeometry(0.07, 0.07, 1.8, 16);
    shaftGeom.translate(0, 0.9, 0);
    shaftGeom.rotateX(Math.PI / 2); // align along +Z

    this.arrowShaftPos = new THREE.Mesh(shaftGeom, this.arrowMaterial);
    this.arrowShaftPos.renderOrder = 99999;
    this.gizmoRoot.add(this.arrowShaftPos);

    const coneGeom = new THREE.ConeGeometry(0.28, 0.65, 16);
    coneGeom.translate(0, 0.325, 0);
    coneGeom.rotateX(Math.PI / 2); // point along +Z
    coneGeom.translate(0, 0, 1.8);

    this.arrowConePos = new THREE.Mesh(coneGeom, this.arrowMaterial);
    this.arrowConePos.renderOrder = 100000;
    this.gizmoRoot.add(this.arrowConePos);

    // Reverse Normal Arrow (-Z direction in local space)
    const shaftNegGeom = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 16);
    shaftNegGeom.translate(0, 0.7, 0);
    shaftNegGeom.rotateX(-Math.PI / 2); // align along -Z

    this.arrowShaftNeg = new THREE.Mesh(shaftNegGeom, this.arrowMaterial);
    this.arrowShaftNeg.renderOrder = 99999;
    this.gizmoRoot.add(this.arrowShaftNeg);

    const coneNegGeom = new THREE.ConeGeometry(0.22, 0.55, 16);
    coneNegGeom.translate(0, 0.275, 0);
    coneNegGeom.rotateX(-Math.PI / 2); // point along -Z
    coneNegGeom.translate(0, 0, -1.4);

    this.arrowConeNeg = new THREE.Mesh(coneNegGeom, this.arrowMaterial);
    this.arrowConeNeg.renderOrder = 100000;
    this.gizmoRoot.add(this.arrowConeNeg);

    // Arrow interactive hitboxes
    const arrowHitboxGeom = new THREE.CylinderGeometry(0.4, 0.4, 3.8, 12);
    arrowHitboxGeom.rotateX(Math.PI / 2);
    arrowHitboxGeom.translate(0, 0, 0.4);
    const arrowHitbox = new THREE.Mesh(
      arrowHitboxGeom,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    arrowHitbox.userData = { isGizmo: true, type: "arrow" };
    this.gizmoRoot.add(arrowHitbox);
    this.interactiveHitboxes.push(arrowHitbox);

    // 3. Four Corner Handles
    const cornerGeom = new THREE.OctahedronGeometry(0.28);
    const cornerHitboxGeom = new THREE.SphereGeometry(0.6, 10, 10);

    for (let i = 0; i < 4; i++) {
      const cornerMesh = new THREE.Mesh(cornerGeom, this.handleMaterial);
      cornerMesh.renderOrder = 100000;
      this.gizmoRoot.add(cornerMesh);
      this.cornerHandles.push(cornerMesh);

      const cornerHit = new THREE.Mesh(
        cornerHitboxGeom,
        new THREE.MeshBasicMaterial({ visible: false })
      );
      cornerHit.userData = { isGizmo: true, type: "corner", index: i };
      this.gizmoRoot.add(cornerHit);
      this.interactiveHitboxes.push(cornerHit);
    }

    // 4. Four Mid-Edge Handles
    const edgeGeom = new THREE.BoxGeometry(0.4, 0.16, 0.16);
    const edgeHitboxGeom = new THREE.BoxGeometry(0.8, 0.5, 0.5);

    for (let i = 0; i < 4; i++) {
      const edgeMesh = new THREE.Mesh(edgeGeom, this.handleMaterial);
      edgeMesh.renderOrder = 100000;
      this.gizmoRoot.add(edgeMesh);
      this.edgeHandles.push(edgeMesh);

      const edgeHit = new THREE.Mesh(
        edgeHitboxGeom,
        new THREE.MeshBasicMaterial({ visible: false })
      );
      edgeHit.userData = { isGizmo: true, type: "edge", index: i };
      this.gizmoRoot.add(edgeHit);
      this.interactiveHitboxes.push(edgeHit);
    }

    // 5. Plane Boundary Frame Lines
    const framePoints = [
      new THREE.Vector3(-1, -1, 0),
      new THREE.Vector3(1, -1, 0),
      new THREE.Vector3(1, -1, 0),
      new THREE.Vector3(1, 1, 0),
      new THREE.Vector3(1, 1, 0),
      new THREE.Vector3(-1, 1, 0),
      new THREE.Vector3(-1, 1, 0),
      new THREE.Vector3(-1, -1, 0),
    ];
    const frameGeom = new THREE.BufferGeometry().setFromPoints(framePoints);
    this.frameLines = new THREE.LineSegments(frameGeom, this.frameMaterial);
    this.frameLines.renderOrder = 99999;
    this.gizmoRoot.add(this.frameLines);
  }

  private initTooltipDOM() {
    if (typeof document === "undefined") return;

    let tooltip = document.getElementById("section-gizmo-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "section-gizmo-tooltip";
      tooltip.className = "section-gizmo-tooltip hidden";
      tooltip.innerHTML = `
        <span class="gizmo-tooltip-icon">⇅</span>
        <span class="gizmo-tooltip-axis" id="gizmo-tooltip-axis">Y FLOOR CUT</span>
        <span class="gizmo-tooltip-sep">•</span>
        <span class="gizmo-tooltip-offset" id="gizmo-tooltip-offset">Δ 0.00m</span>
        <span class="gizmo-tooltip-coord" id="gizmo-tooltip-coord">(Y: +0.0m)</span>
      `;

      const viewportContainer =
        document.getElementById("container") || document.body;
      viewportContainer.appendChild(tooltip);
    }
    this.tooltipEl = tooltip;
  }

  private bindEvents() {
    const container = this.engine.container || document.getElementById("container");
    if (!container) return;

    // Pointer Down (Grab Gizmo)
    container.addEventListener("pointerdown", (e: PointerEvent) => this.onPointerDown(e), {
      capture: true,
    });

    // Pointer Move (Drag or Hover Gizmo)
    window.addEventListener("pointermove", (e: PointerEvent) => this.onPointerMove(e), {
      passive: false,
    });

    // Pointer Up (Release Gizmo)
    window.addEventListener("pointerup", (e: PointerEvent) => this.onPointerUp(e));
    window.addEventListener("pointercancel", (e: PointerEvent) => this.onPointerUp(e));
  }

  /**
   * Attaches the 3D Gizmo to a specific cutting plane.
   */
  public attachToPlane(plane: any | null) {
    this.activePlane = plane;

    if (!plane || plane.enabled === false || plane.visible === false) {
      this.gizmoRoot.visible = false;
      this.hideTooltip();
      return;
    }

    this.gizmoRoot.visible = true;
    this.updateThemeColors(plane);
    this.updateTransform();
  }

  /**
   * Detaches the gizmo.
   */
  public detach() {
    this.activePlane = null;
    this.gizmoRoot.visible = false;
    this.hideTooltip();
  }

  /**
   * Updates materials to match the specific cutting plane's color.
   */
  public updateThemeColors(plane: any) {
    const threeColor = this.clippingModule.getPlaneThreeColor(plane);
    this.handleMaterial.color.copy(threeColor);
    this.arrowMaterial.color.copy(threeColor);
    this.discMaterial.color.copy(threeColor);
    this.frameMaterial.color.copy(threeColor);

    const cssColor = this.clippingModule.getPlaneColor(plane);
    if (this.tooltipEl) {
      this.tooltipEl.style.setProperty("--active-plane-color", cssColor);
    }
  }

  /**
   * Positions and orients the gizmo to match the active cutting plane.
   */
  public updateTransform() {
    if (!this.activePlane || !this.gizmoRoot.visible) return;

    const origin = this.activePlane.origin || new THREE.Vector3();
    const normal = (this.activePlane.normal || new THREE.Vector3(0, 1, 0)).clone().normalize();

    this.gizmoRoot.position.copy(origin);

    // Align local +Z axis with plane normal
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal
    );
    this.gizmoRoot.quaternion.copy(quat);

    // Position corner and edge handles to match plane boundary
    const size = this.activePlane.size || 5;
    const half = size / 2;

    // Corner positions
    const corners = [
      new THREE.Vector3(-half, -half, 0),
      new THREE.Vector3(half, -half, 0),
      new THREE.Vector3(half, half, 0),
      new THREE.Vector3(-half, half, 0),
    ];

    this.cornerHandles.forEach((handle, i) => {
      handle.position.copy(corners[i]);
    });

    // Mid-edge positions
    const edges = [
      new THREE.Vector3(0, -half, 0),
      new THREE.Vector3(half, 0, 0),
      new THREE.Vector3(0, half, 0),
      new THREE.Vector3(-half, 0, 0),
    ];

    this.edgeHandles.forEach((handle, i) => {
      handle.position.copy(edges[i]);
      if (i % 2 === 1) {
        handle.rotation.z = Math.PI / 2;
      } else {
        handle.rotation.z = 0;
      }
    });

    // Update boundary frame geometry scale
    this.frameLines.scale.set(half, half, 1);

    this.updateScale();
  }

  /**
   * Dynamically adjusts scale so the gizmo remains clearly visible at any camera zoom.
   */
  public updateScale() {
    if (!this.activePlane || !this.gizmoRoot.visible) return;

    const camera = this.engine.world?.camera?.three;
    if (!camera) return;

    const distance = camera.position.distanceTo(this.gizmoRoot.position);
    // Smooth adaptive scaling based on camera distance and plane size
    const dynamicScale = Math.max(0.65, Math.min(distance * 0.075, 45.0));
    this.gizmoRoot.scale.setScalar(dynamicScale);
  }

  private startRenderLoop() {
    const tick = () => {
      if (this.gizmoRoot.visible && this.activePlane) {
        this.updateScale();
      }
      this.animFrameId = requestAnimationFrame(tick);
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  /**
   * Computes ray from camera through normalized device mouse coordinates.
   */
  private getMouseRay(e: PointerEvent): THREE.Ray | null {
    const container = this.engine.container;
    const camera = this.engine.world?.camera?.three;
    if (!container || !camera) return null;

    const rect = container.getBoundingClientRect();
    this.mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVec, camera as any);
    return this.raycaster.ray;
  }

  /**
   * Projects a 3D ray onto the cutting plane normal line using closest-points line calculation.
   */
  private projectRayOntoNormalAxis(
    ray: THREE.Ray,
    origin: THREE.Vector3,
    normal: THREE.Vector3
  ): number {
    const O = ray.origin;
    const D = ray.direction.clone().normalize();
    const P0 = origin;
    const N = normal.clone().normalize();

    const w0 = new THREE.Vector3().subVectors(O, P0);
    const a = 1.0; // D.dot(D)
    const b = D.dot(N);
    const c = 1.0; // N.dot(N)
    const d = D.dot(w0);
    const e = N.dot(w0);

    const denom = a * c - b * b; // 1 - b^2
    if (denom > 1e-5) {
      return (e - b * d) / denom;
    } else {
      // Ray is nearly parallel to the cutting normal vector
      return e;
    }
  }

  private onPointerDown(e: PointerEvent) {
    if (e.button !== 0 || !this.activePlane || !this.gizmoRoot.visible) return;

    const ray = this.getMouseRay(e);
    if (!ray) return;

    const intersects = this.raycaster.intersectObjects(this.interactiveHitboxes, true);
    if (intersects.length > 0) {
      e.preventDefault();
      e.stopPropagation();

      this.isDragging = true;
      this.initialPlaneOrigin = (this.activePlane.origin || new THREE.Vector3()).clone();
      this.planeNormal = (
        this.activePlane.normal || new THREE.Vector3(0, 1, 0)
      )
        .clone()
        .normalize();

      // Temporarily disable camera orbit controls so dragging cuts smoothly
      if (this.engine.world?.camera?.controls) {
        (this.engine.world.camera.controls as any).enabled = false;
      }

      document.body.style.cursor = "grabbing";

      this.dragStartParam = this.projectRayOntoNormalAxis(
        ray,
        this.initialPlaneOrigin,
        this.planeNormal
      );

      this.showTooltip(this.activePlane, 0, this.initialPlaneOrigin);
    }
  }

  private onPointerMove(e: PointerEvent) {
    if (this.isDragging && this.activePlane) {
      e.preventDefault();
      e.stopPropagation();

      const ray = this.getMouseRay(e);
      if (!ray) return;

      const currentParam = this.projectRayOntoNormalAxis(
        ray,
        this.initialPlaneOrigin,
        this.planeNormal
      );

      const deltaT = currentParam - this.dragStartParam;
      const newOrigin = this.initialPlaneOrigin
        .clone()
        .addScaledVector(this.planeNormal, deltaT);

      // Apply new position to the plane in 3D
      try {
        this.activePlane.setFromNormalAndCoplanarPoint(this.planeNormal, newOrigin);
      } catch {
        if (
          this.activePlane.three &&
          typeof this.activePlane.three.setFromNormalAndCoplanarPoint === "function"
        ) {
          this.activePlane.three.setFromNormalAndCoplanarPoint(this.planeNormal, newOrigin);
        }
      }

      // Update gizmo position in 3D scene
      this.gizmoRoot.position.copy(newOrigin);

      // Real-time BIM geometry slicing update
      if (this.engine.fragments && this.engine.fragments.core) {
        this.engine.fragments.core.update(true);
      }

      this.showTooltip(this.activePlane, deltaT, newOrigin);
      return;
    }

    // Hover state management
    if (!this.isDragging && this.activePlane && this.gizmoRoot.visible) {
      const ray = this.getMouseRay(e);
      if (!ray) return;

      const intersects = this.raycaster.intersectObjects(this.interactiveHitboxes, true);
      if (intersects.length > 0) {
        if (!this.isHovered) {
          this.isHovered = true;
          document.body.style.cursor = "grab";
          this.centerSphere.material = this.hoverMaterial;
          this.arrowConePos.material = this.hoverMaterial;
        }
      } else {
        if (this.isHovered) {
          this.isHovered = false;
          document.body.style.cursor = "default";
          this.centerSphere.material = this.handleMaterial;
          this.arrowConePos.material = this.arrowMaterial;
        }
      }
    }
  }

  private onPointerUp(_e: PointerEvent) {
    if (this.isDragging) {
      this.isDragging = false;
      document.body.style.cursor = "default";

      // Re-enable camera controls
      if (this.engine.world?.camera?.controls) {
        (this.engine.world.camera.controls as any).enabled = true;
      }

      if (this.activePlane) {
        if (!this.activePlane.userData) this.activePlane.userData = {};
        this.activePlane.userData.targetOrigin = (
          this.activePlane.origin || new THREE.Vector3()
        ).clone();
      }

      this.clippingModule.notifyPlanesChanged();
      this.hideTooltip();
    }
  }

  private showTooltip(plane: any, delta: number, currentOrigin?: THREE.Vector3) {
    if (!this.tooltipEl) return;

    const meta = this.clippingModule.getPlaneAxisMeta(plane);
    const planeName = this.clippingModule.getPlaneName(plane);
    const axisEl = this.tooltipEl.querySelector("#gizmo-tooltip-axis");
    const offsetEl = this.tooltipEl.querySelector("#gizmo-tooltip-offset");
    const coordEl = this.tooltipEl.querySelector("#gizmo-tooltip-coord");

    if (axisEl) axisEl.textContent = `${planeName} • ${meta.axis} (${meta.label})`;
    if (offsetEl) {
      const sign = delta >= 0 ? "+" : "";
      offsetEl.textContent = `Δ ${sign}${delta.toFixed(2)}m`;
    }
    if (coordEl && currentOrigin) {
      coordEl.textContent = `(Pos: X:${currentOrigin.x.toFixed(1)} Y:${currentOrigin.y.toFixed(1)} Z:${currentOrigin.z.toFixed(1)})`;
    }

    this.tooltipEl.classList.remove("hidden");
  }

  private hideTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.classList.add("hidden");
    }
  }

  public isGizmoDragging(): boolean {
    return this.isDragging;
  }

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.detach();
    if (this.gizmoRoot.parent) {
      this.gizmoRoot.parent.remove(this.gizmoRoot);
    }
    if (this.tooltipEl && this.tooltipEl.parentNode) {
      this.tooltipEl.parentNode.removeChild(this.tooltipEl);
    }
  }
}
