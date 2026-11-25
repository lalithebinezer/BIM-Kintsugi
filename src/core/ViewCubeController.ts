/**
 * ViewCubeController — Extracted 3D ViewCube Orientation & Cardinal Navigation Wiring
 * Keeps `src/main.ts` leaner by encapsulating all ViewCube face/cardinal/drag bindings.
 */

import * as THREE from "three";
import * as OBC from "@thatopen/components";

export interface ViewCubeBindingDeps {
  world: {
    camera: {
      three: THREE.Camera;
      controls: {
        getTarget: (out: THREE.Vector3) => void;
        distance?: number;
        setLookAt: (
          px: number,
          py: number,
          pz: number,
          tx: number,
          ty: number,
          tz: number,
          smooth: boolean
        ) => Promise<void> | void;
        addEventListener: (event: string, cb: () => void) => void;
        rotate: (dx: number, dy: number, smooth: boolean) => void;
      };
    };
  };
  components: OBC.Components;
  onHomeClick: () => void;
}

export interface ViewCubeHandle {
  element: any;
  orientCameraToFace: (face: string) => Promise<void>;
  syncCamera: () => void;
}

export function initViewCubeController(deps: ViewCubeBindingDeps): ViewCubeHandle {
  const { world, components, onHomeClick } = deps;

  async function orientCameraToFace(face: string): Promise<void> {
    const target = new THREE.Vector3();
    world.camera.controls.getTarget(target);

    const boxer = components.get(OBC.BoundingBoxer);
    boxer.list.clear();
    boxer.addFromModels();
    const bbox = boxer.get();
    boxer.list.clear();

    const center = new THREE.Vector3();
    let d = 20;
    if (!bbox.isEmpty()) {
      bbox.getCenter(center);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      d = Math.max(size.x, size.y, size.z) * 1.5;
    } else {
      center.copy(target);
      d = world.camera.controls.distance || 20;
    }

    let posX = center.x;
    let posY = center.y;
    let posZ = center.z;

    switch (face) {
      case "front": posZ += d; break;
      case "back": posZ -= d; break;
      case "left": posX -= d; break;
      case "right": posX += d; break;
      case "top": posY += d; break;
      case "bottom": posY -= d; break;
    }

    await world.camera.controls.setLookAt(posX, posY, posZ, center.x, center.y, center.z, true);
  }

  const viewCube = document.getElementById("view-cube") as any;
  const syncCamera = () => {
    if (viewCube && world.camera.three) {
      viewCube.camera = world.camera.three;
      viewCube.updateOrientation?.();
    }
  };

  if (viewCube) {
    syncCamera();

    world.camera.controls.addEventListener("update", () => viewCube.updateOrientation?.());
    world.camera.controls.addEventListener("control", () => viewCube.updateOrientation?.());

    viewCube.addEventListener("drag", (e: any) => {
      world.camera.controls.rotate(e.detail.dx, e.detail.dy, false);
    });

    viewCube.addEventListener("frontclick", () => void orientCameraToFace("front"));
    viewCube.addEventListener("backclick", () => void orientCameraToFace("back"));
    viewCube.addEventListener("leftclick", () => void orientCameraToFace("left"));
    viewCube.addEventListener("rightclick", () => void orientCameraToFace("right"));
    viewCube.addEventListener("topclick", () => void orientCameraToFace("top"));
    viewCube.addEventListener("bottomclick", () => void orientCameraToFace("bottom"));
    viewCube.addEventListener("homeclick", () => onHomeClick());
    viewCube.addEventListener("cardinalclick", (e: any) => {
      const cardinal = e.detail?.cardinal;
      if (cardinal === "north") void orientCameraToFace("back");
      else if (cardinal === "south") void orientCameraToFace("front");
      else if (cardinal === "east") void orientCameraToFace("right");
      else if (cardinal === "west") void orientCameraToFace("left");
    });
  }

  return { element: viewCube, orientCameraToFace, syncCamera };
}
