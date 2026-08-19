import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { ExplosionModule } from "../ExplosionModule";

describe("ExplosionModule — 3D BIM Disassembly Suite", () => {
  let explosionModule: ExplosionModule;
  let mockMesh: THREE.Mesh;
  let mockInstancedMesh: THREE.InstancedMesh;
  let mockModelGroup: THREE.Group;

  beforeEach(() => {
    mockModelGroup = new THREE.Group();

    // Standard Mesh (Wall)
    const geom = new THREE.BoxGeometry(4, 4, 4);
    const mat = new THREE.MeshBasicMaterial();
    mockMesh = new THREE.Mesh(geom, mat);
    mockMesh.name = "IFCWALL_01";
    mockMesh.position.set(10, 5, 0);
    mockModelGroup.add(mockMesh);

    // InstancedMesh (Columns)
    mockInstancedMesh = new THREE.InstancedMesh(geom, mat, 2);
    mockInstancedMesh.name = "IFCCOLUMN_GROUP";
    const m1 = new THREE.Matrix4().makeTranslation(20, 0, 0);
    const m2 = new THREE.Matrix4().makeTranslation(-20, 10, 5);
    mockInstancedMesh.setMatrixAt(0, m1);
    mockInstancedMesh.setMatrixAt(1, m2);
    mockInstancedMesh.instanceMatrix.needsUpdate = true;
    mockModelGroup.add(mockInstancedMesh);

    // Mock BimEngine fragments
    const mockFragments = {
      list: new Map<string, any>([
        ["model-1", { object: mockModelGroup }]
      ]),
      core: { update: () => {} }
    };

    // Inject mock into singleton
    explosionModule = ExplosionModule.getInstance();
    (explosionModule as any).engine = { 
      fragments: mockFragments,
      world: { renderer: { update: () => {} } }
    };
    explosionModule.reset();
  });

  it("should snapshot initial positions and instance matrices", () => {
    explosionModule.cacheOriginalPositions();
    expect((explosionModule as any).originalPositions.size).toBeGreaterThan(0);
    expect((explosionModule as any).originalInstanceMatrices.size).toBeGreaterThan(0);
  });

  it("should support switching clustering modes (category-cluster, storey-cluster, radial)", () => {
    expect(explosionModule.getClusteringMode()).toBe("category-cluster");

    explosionModule.setClusteringMode("radial");
    expect(explosionModule.getClusteringMode()).toBe("radial");

    explosionModule.setClusteringMode("storey-cluster");
    expect(explosionModule.getClusteringMode()).toBe("storey-cluster");
  });

  it("should displace elements into category cluster pods in category-cluster mode", () => {
    explosionModule.setClusteringMode("category-cluster");
    explosionModule.cacheOriginalPositions();
    const initialPos = mockMesh.position.clone();

    explosionModule.setExplosionFactor(0.8);
    expect(mockMesh.position.equals(initialPos)).toBe(false);
  });

  it("should displace instanced mesh instances when factor > 0", () => {
    explosionModule.cacheOriginalPositions();
    const origMatrix = new THREE.Matrix4();
    mockInstancedMesh.getMatrixAt(0, origMatrix);
    const origPos = new THREE.Vector3().setFromMatrixPosition(origMatrix);

    explosionModule.setExplosionFactor(1.0);

    const newMatrix = new THREE.Matrix4();
    mockInstancedMesh.getMatrixAt(0, newMatrix);
    const newPos = new THREE.Vector3().setFromMatrixPosition(newMatrix);

    expect(newPos.equals(origPos)).toBe(false);
  });

  it("should restore exact original positions on factor = 0 across mode switches", () => {
    explosionModule.cacheOriginalPositions();
    const initialPos = mockMesh.position.clone();

    // Explode in category-cluster
    explosionModule.setClusteringMode("category-cluster");
    explosionModule.setExplosionFactor(0.75);

    // Switch mode to radial while exploded
    explosionModule.setClusteringMode("radial");

    // Reset back to 0
    explosionModule.setExplosionFactor(0.0);

    expect(mockMesh.position.x).toBeCloseTo(initialPos.x, 3);
    expect(mockMesh.position.y).toBeCloseTo(initialPos.y, 3);
    expect(mockMesh.position.z).toBeCloseTo(initialPos.z, 3);
  });
});
