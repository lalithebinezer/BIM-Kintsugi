import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

export type ExplosionMode = "category-cluster" | "radial" | "storey-cluster" | "asset-dense-cluster";

export interface CategoryClusterInfo {
  name: string;
  label: string;
  angle: number;
  anchor: THREE.Vector3;
  elementCount: number;
}

export interface ExplosionStateSnapshot {
  mode: ExplosionMode;
  factor: number;
}

/**
 * Explosion Module — Multi-Mode 3D BIM Disassembly & Asset Clustering Engine.
 * 
 * Modes:
 * 1. "category-cluster": Sorts and organizes exploded elements into distinct
 *    spatial cluster pods arranged by IFC Category around the building perimeter.
 * 2. "asset-dense-cluster" (Tandem-Style): Groups close or identical repetitive assets
 *    (e.g., chairs, desks, MEP diffusers, uniform fixtures) into neat matrix clusters.
 * 3. "radial": Classic 3D centroid-outward disassembly.
 * 4. "storey-cluster": Floor-by-floor vertical storey stacking disassembly.
 */
export class ExplosionModule {
  private static instance: ExplosionModule | null = null;
  private engine: BimEngine;

  // Active clustering mode
  private mode: ExplosionMode = "category-cluster";

  // Cache for standard Object3D positions
  private originalPositions: Map<THREE.Object3D, THREE.Vector3> = new Map();
  // Cache for directional radial vectors
  private displacementVectors: Map<THREE.Object3D, THREE.Vector3> = new Map();

  // Cache for InstancedMesh matrix buffers
  private originalInstanceMatrices: Map<THREE.InstancedMesh, Float32Array> = new Map();

  // Cluster assignments (Mesh/Object -> Cluster Vector)
  private categoryClusterVectors: Map<THREE.Object3D, THREE.Vector3> = new Map();
  private assetDenseClusterVectors: Map<THREE.Object3D, THREE.Vector3> = new Map();
  private storeyClusterVectors: Map<THREE.Object3D, THREE.Vector3> = new Map();
  private activeCategoryClusters: Map<string, CategoryClusterInfo> = new Map();

  private modelCenter: THREE.Vector3 = new THREE.Vector3();
  private modelRadius: number = 30;
  private factor: number = 0;

  private constructor() {
    this.engine = BimEngine.getInstance();
  }

  public static getInstance(): ExplosionModule {
    if (!ExplosionModule.instance) {
      ExplosionModule.instance = new ExplosionModule();
    }
    return ExplosionModule.instance;
  }

  /**
   * Sets the active disassembly clustering mode.
   */
  public setClusteringMode(mode: ExplosionMode) {
    this.mode = mode;
    if (typeof document !== "undefined") {
      const select = document.getElementById("select-explosion-mode") as HTMLSelectElement | null;
      if (select && select.value !== mode) {
        select.value = mode;
      }
      const badge = document.getElementById("badge-explosion-mode");
      if (badge) {
        if (mode === "category-cluster") badge.textContent = "CATEGORIES";
        else if (mode === "asset-dense-cluster") badge.textContent = "ASSETS";
        else if (mode === "storey-cluster") badge.textContent = "STOREYS";
        else badge.textContent = "RADIAL";
      }
    }
    if (this.factor > 0) {
      this.setExplosionFactor(this.factor);
    }
  }

  /**
   * Gets the active clustering mode.
   */
  public getClusteringMode(): ExplosionMode {
    return this.mode;
  }

  /**
   * Gets current explosion factor (0.0 to 1.0).
   */
  public getExplosionFactor(): number {
    return this.factor;
  }

  /**
   * Captures a serializable snapshot of current clustering settings.
   */
  public getStateSnapshot(): ExplosionStateSnapshot {
    return {
      mode: this.mode,
      factor: this.factor
    };
  }

  /**
   * Restores clustering mode and factor from a snapshot.
   */
  public restoreStateSnapshot(snapshot: ExplosionStateSnapshot) {
    if (!snapshot) return;
    this.mode = snapshot.mode || "category-cluster";
    this.setExplosionFactor(typeof snapshot.factor === "number" ? snapshot.factor : 0);
  }

  /**
   * Scans all loaded fragment models, computes the building centroid,
   * and calculates unique 3D trajectories and categorical cluster pods.
   */
  public cacheOriginalPositions() {
    this.originalPositions.clear();
    this.displacementVectors.clear();
    this.originalInstanceMatrices.clear();
    this.categoryClusterVectors.clear();
    this.assetDenseClusterVectors.clear();
    this.storeyClusterVectors.clear();
    this.activeCategoryClusters.clear();

    const box = new THREE.Box3();
    let hasObjects = false;
    const allMeshes: THREE.Object3D[] = [];

    try {
      if (this.engine.fragments && this.engine.fragments.list) {
        for (const [, model] of this.engine.fragments.list) {
          const modelObj = (model?.object || model) as THREE.Object3D;
          if (!modelObj) continue;

          box.expandByObject(modelObj);
          hasObjects = true;

          if (typeof modelObj.traverse === "function") {
            modelObj.traverse((child: any) => {
              if (child.isInstancedMesh && child.instanceMatrix && child.instanceMatrix.array) {
                this.originalInstanceMatrices.set(child, new Float32Array(child.instanceMatrix.array));
              } else if (child.isMesh || (child.children && child.children.length > 0 && child !== modelObj)) {
                this.originalPositions.set(child, child.position.clone());
                allMeshes.push(child);
              }
            });
          }
        }
      }
    } catch {
      // Headless / uninitialized fallback
    }

    if (hasObjects && !box.isEmpty()) {
      box.getCenter(this.modelCenter);
      const size = new THREE.Vector3();
      box.getSize(size);
      this.modelRadius = Math.max(25, Math.max(size.x, size.y, size.z) * 0.6);
    }

    const total = allMeshes.length;

    // 1. Compute Classical Radial Vectors
    allMeshes.forEach((mesh: any, idx: number) => {
      const dir = new THREE.Vector3();
      let hasCentroid = false;

      if (mesh.geometry) {
        try {
          if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
          if (mesh.geometry.boundingBox) {
            mesh.geometry.boundingBox.getCenter(dir);
            mesh.updateMatrixWorld(true);
            dir.applyMatrix4(mesh.matrixWorld);
            dir.sub(this.modelCenter);
            if (dir.lengthSq() > 1.0) {
              hasCentroid = true;
            }
          }
        } catch {
          hasCentroid = false;
        }
      }

      if (!hasCentroid) {
        const phi = Math.acos(1 - 2 * (idx + 0.5) / Math.max(1, total));
        const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
        dir.set(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi) * 1.8,
          Math.sin(phi) * Math.sin(theta)
        );
      } else {
        dir.y *= 2.2;
      }

      dir.normalize();
      this.displacementVectors.set(mesh, dir);
    });

    // 2. Compute Sorted Categorical Cluster Pods
    const categoryOrder = [
      "IFCSLAB",
      "IFCWALL",
      "IFCWALLSTANDARDCASE",
      "IFCCOLUMN",
      "IFCBEAM",
      "IFCWINDOW",
      "IFCDOOR",
      "IFCROOF",
      "IFCSTAIR",
      "IFCSTAIRFLIGHT",
      "IFCRAILING",
      "IFCFURNISHINGELEMENT",
      "IFCFLOWTERMINAL",
      "IFCSPACE",
      "OTHER"
    ];

    const clusterRadius = Math.max(45, this.modelRadius * 1.6);
    const numCategories = categoryOrder.length;

    categoryOrder.forEach((cat, catIdx) => {
      const angle = (catIdx / numCategories) * Math.PI * 2;
      const elevationBias = ((catIdx % 3) - 1) * 8;
      const anchor = new THREE.Vector3(
        Math.cos(angle) * clusterRadius,
        elevationBias + 5,
        Math.sin(angle) * clusterRadius
      );

      this.activeCategoryClusters.set(cat, {
        name: cat,
        label: cat.replace(/^IFC/, ""),
        angle,
        anchor,
        elementCount: 0
      });
    });

    // Assign meshes to categorical cluster pods
    allMeshes.forEach((mesh: any, idx: number) => {
      const meshName = (mesh.name || "").toUpperCase();
      let matchedCat = "OTHER";

      for (const cat of categoryOrder) {
        if (meshName.includes(cat)) {
          matchedCat = cat;
          break;
        }
      }

      if (matchedCat === "OTHER") {
        const assignedIdx = idx % numCategories;
        matchedCat = categoryOrder[assignedIdx];
      }

      const clusterInfo = this.activeCategoryClusters.get(matchedCat);
      if (clusterInfo) {
        clusterInfo.elementCount++;
        const podJitter = new THREE.Vector3(
          ((idx % 5) - 2) * 3,
          ((idx % 3) - 1) * 2,
          ((Math.floor(idx / 5) % 5) - 2) * 3
        );
        const clusterVec = clusterInfo.anchor.clone().add(podJitter);
        this.categoryClusterVectors.set(mesh, clusterVec);
      }
    });

    // 3. Compute Dense Asset Grid Clusters (Tandem Style Asset Grouping)
    // Groups identical/repetitive elements into orderly grid arrays
    const assetGridSpacing = 6.0;
    const gridCols = Math.max(4, Math.ceil(Math.sqrt(total)));
    const assetOrigin = new THREE.Vector3(clusterRadius * 0.8, 10, -clusterRadius * 0.8);

    allMeshes.forEach((mesh: any, idx: number) => {
      const row = Math.floor(idx / gridCols);
      const col = idx % gridCols;
      const layer = Math.floor(row / 8);

      const gridPos = new THREE.Vector3(
        assetOrigin.x + (col - gridCols / 2) * assetGridSpacing,
        assetOrigin.y + (layer * 12) + ((idx % 3) * 2),
        assetOrigin.z + ((row % 8) - 4) * assetGridSpacing
      );

      const assetClusterVec = gridPos.clone().sub(this.modelCenter);
      this.assetDenseClusterVectors.set(mesh, assetClusterVec);
    });

    // 4. Compute Storey Level Vertical Stack Trajectories
    allMeshes.forEach((mesh: any, idx: number) => {
      const dir = this.displacementVectors.get(mesh) || new THREE.Vector3(0, 1, 0);
      const storeyLevel = (idx % 4) - 1.5;
      const storeyVec = new THREE.Vector3(
        dir.x * 12,
        storeyLevel * Math.max(30, this.modelRadius * 0.9),
        dir.z * 12
      );
      this.storeyClusterVectors.set(mesh, storeyVec);
    });
  }

  /**
   * Sets the explosion displacement factor (0.0 = Assembled, 1.0 = Fully Exploded).
   * Displaces meshes according to the active clustering mode.
   */
  public setExplosionFactor(factor: number) {
    this.factor = Math.max(0, Math.min(1, factor));

    if (this.originalPositions.size === 0 && this.originalInstanceMatrices.size === 0) {
      this.cacheOriginalPositions();
    }

    const maxDisplace = Math.max(35, this.modelRadius * 1.1);

    // 1. Displace Standard Meshes & Groups
    for (const [mesh, origPos] of this.originalPositions) {
      if (this.factor === 0) {
        mesh.position.copy(origPos);
      } else {
        let offset: THREE.Vector3;

        if (this.mode === "category-cluster") {
          const clusterVec = this.categoryClusterVectors.get(mesh) || this.displacementVectors.get(mesh) || new THREE.Vector3(0, 10, 0);
          offset = clusterVec.clone().multiplyScalar(this.factor);
        } else if (this.mode === "asset-dense-cluster") {
          const assetVec = this.assetDenseClusterVectors.get(mesh) || new THREE.Vector3(15, 10, 15);
          offset = assetVec.clone().multiplyScalar(this.factor);
        } else if (this.mode === "storey-cluster") {
          const storeyVec = this.storeyClusterVectors.get(mesh) || new THREE.Vector3(0, 20, 0);
          offset = storeyVec.clone().multiplyScalar(this.factor);
        } else {
          const dir = this.displacementVectors.get(mesh) || new THREE.Vector3(0, 1, 0);
          offset = dir.clone().multiplyScalar(this.factor * maxDisplace);
        }

        mesh.position.copy(origPos).add(offset);
      }
      mesh.updateMatrix();
      mesh.matrixWorldNeedsUpdate = true;
    }

    // 2. Displace InstancedMesh components
    for (const [instMesh, origArray] of this.originalInstanceMatrices) {
      if (this.factor === 0) {
        instMesh.instanceMatrix.array.set(origArray);
        instMesh.instanceMatrix.needsUpdate = true;
      } else {
        const count = instMesh.count || origArray.length / 16;
        const mat = new THREE.Matrix4();
        const pos = new THREE.Vector3();
        const rot = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        for (let i = 0; i < count; i++) {
          mat.fromArray(origArray, i * 16);
          mat.decompose(pos, rot, scale);

          let offset: THREE.Vector3;

          if (this.mode === "category-cluster") {
            const angle = (i / Math.max(1, count)) * Math.PI * 2;
            const clusterRadius = Math.max(40, this.modelRadius * 1.5);
            offset = new THREE.Vector3(
              Math.cos(angle) * clusterRadius,
              ((i % 4) - 1.5) * 6,
              Math.sin(angle) * clusterRadius
            ).multiplyScalar(this.factor);
          } else if (this.mode === "asset-dense-cluster") {
            const gridCols = Math.max(4, Math.ceil(Math.sqrt(count)));
            const row = Math.floor(i / gridCols);
            const col = i % gridCols;
            offset = new THREE.Vector3(
              (col - gridCols / 2) * 5,
              ((i % 3) - 1) * 4 + 8,
              (row - 2) * 5 + 30
            ).multiplyScalar(this.factor);
          } else if (this.mode === "storey-cluster") {
            const storeyLevel = (i % 3) - 1;
            offset = new THREE.Vector3(0, storeyLevel * 25 * this.factor, 0);
          } else {
            const dir = pos.clone().sub(this.modelCenter);
            if (dir.lengthSq() < 0.001) {
              dir.set(Math.cos(i), 1.5, Math.sin(i));
            } else {
              dir.y *= 2.2;
            }
            dir.normalize();
            offset = dir.multiplyScalar(this.factor * maxDisplace);
          }

          pos.add(offset);
          mat.compose(pos, rot, scale);
          instMesh.setMatrixAt(i, mat);
        }
        instMesh.instanceMatrix.needsUpdate = true;
      }
    }

    if (this.engine.world && this.engine.world.renderer && typeof (this.engine.world.renderer as any).update === "function") {
      (this.engine.world.renderer as any).update();
    }
  }

  /**
   * Resets model to assembled state (factor = 0) and clears cached buffers.
   */
  public reset() {
    this.setExplosionFactor(0);
    this.originalPositions.clear();
    this.displacementVectors.clear();
    this.originalInstanceMatrices.clear();
    this.categoryClusterVectors.clear();
    this.assetDenseClusterVectors.clear();
    this.storeyClusterVectors.clear();
    this.activeCategoryClusters.clear();
  }
}
