import * as THREE from "three";

// ============================================================================
// GRAPHICS ACCELERATOR & GPU PERFORMANCE CONTROLLER
// ============================================================================

export interface GPUProbeResult {
  vendor: string;
  renderer: string;
  unmaskedVendor: string;
  unmaskedRenderer: string;
  glVersion: string;
  shadingLanguageVersion: string;
  maxTextureSize: number;
  maxRenderBufferSize: number;
  maxAnisotropy: number;
  hardwareConcurrency: number;
  deviceMemory: number | string;
  hasDiscreteGPU: boolean;
  dpr: number;
}

export function probeGPUCapabilities(glRenderer?: THREE.WebGLRenderer): GPUProbeResult {
  let gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
  if (glRenderer?.getContext) {
    gl = glRenderer.getContext() as any;
  }
  if (!gl && typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as any;
  }

  const debugExt = gl ? gl.getExtension("WEBGL_debug_renderer_info") : null;
  const unmaskedVendor = (gl && debugExt ? gl.getParameter(debugExt.UNMASKED_VENDOR_WEBGL) : "") || (gl ? gl.getParameter(gl.VENDOR) : "Unknown Vendor");
  const unmaskedRenderer = (gl && debugExt ? gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) : "") || (gl ? gl.getParameter(gl.RENDERER) : "Unknown Renderer");
  const glVersion = gl ? String(gl.getParameter(gl.VERSION)) : "WebGL 2.0";
  const shadingLanguageVersion = gl ? String(gl.getParameter(gl.SHADING_LANGUAGE_VERSION)) : "GLSL ES 3.0";
  const maxTextureSize = gl ? Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) : 8192;
  const maxRenderBufferSize = gl ? Number(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)) : 8192;

  const anisoExt = gl ? (gl.getExtension("EXT_texture_filter_anisotropic") || gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic")) : null;
  const maxAnisotropy = anisoExt && gl ? Number(gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) : 1;

  const nav = typeof navigator !== "undefined" ? (navigator as any) : {};
  const hardwareConcurrency = nav.hardwareConcurrency || 4;
  const deviceMemory = nav.deviceMemory ? `${nav.deviceMemory} GB+` : "Standard";

  const isDiscrete = /nvidia|geforce|rtx|gtx|quadro|radeon|amd|apple m/i.test(unmaskedRenderer);

  return {
    vendor: gl ? String(gl.getParameter(gl.VENDOR)) : "",
    renderer: gl ? String(gl.getParameter(gl.RENDERER)) : "",
    unmaskedVendor: String(unmaskedVendor),
    unmaskedRenderer: String(unmaskedRenderer),
    glVersion,
    shadingLanguageVersion,
    maxTextureSize,
    maxRenderBufferSize,
    maxAnisotropy,
    hardwareConcurrency,
    deviceMemory,
    hasDiscreteGPU: isDiscrete,
    dpr: typeof window !== "undefined" ? window.devicePixelRatio : 1,
  };
}

export function initGraphicsAcceleratorController(world: any, dirLight?: THREE.DirectionalLight | null) {
  const deviceNameEl = document.getElementById("gpu-device-name");
  const apiBackendEl = document.getElementById("gpu-api-backend");
  const dprValEl = document.getElementById("gpu-dpr-val");
  const badgeEl = document.getElementById("gpu-active-badge");

  const presetSelect = document.getElementById("select-gpu-preset") as HTMLSelectElement | null;
  const dprSelect = document.getElementById("select-gpu-dpr") as HTMLSelectElement | null;
  const shadowResSelect = document.getElementById("select-gpu-shadow-res") as HTMLSelectElement | null;
  const fxaaToggle = document.getElementById("toggle-gpu-fxaa") as HTMLInputElement | null;
  const benchBtn = document.getElementById("btn-gpu-bench");
  const guideBtn = document.getElementById("btn-gpu-guide");

  const probe = probeGPUCapabilities(world?.renderer?.three);

  // Clean friendly GPU name (e.g., "NVIDIA GeForce RTX 4070 Ti")
  let cleanName = probe.unmaskedRenderer;
  const match = probe.unmaskedRenderer.match(/NVIDIA GeForce [^,)]+|NVIDIA [^,)]+|AMD Radeon [^,)]+|Apple M\d[^,)]*|Intel[^,)]+/i);
  if (match) cleanName = match[0];

  if (deviceNameEl) {
    deviceNameEl.textContent = cleanName;
    deviceNameEl.title = probe.unmaskedRenderer;
  }
  if (apiBackendEl) {
    apiBackendEl.textContent = probe.glVersion.includes("2.0") ? "WebGL 2.0 (Direct3D 11)" : "WebGL 1.0";
  }
  if (badgeEl) {
    badgeEl.textContent = probe.hasDiscreteGPU ? "Dedicated GPU" : "Hardware On";
  }

  const updateDprDisplay = (val: number) => {
    if (dprValEl) {
      dprValEl.textContent = `${val.toFixed(2)}x (${val >= 2 ? "Ultra Sharp" : val >= 1.5 ? "High-Q" : val >= 1.0 ? "Native" : "Fast Eco"})`;
    }
  };

  const currentDpr = world?.renderer?.three?.getPixelRatio ? world.renderer.three.getPixelRatio() : Math.min(window.devicePixelRatio, 2);
  updateDprDisplay(currentDpr);
  if (dprSelect) {
    dprSelect.value = currentDpr >= 1.9 ? "2.0" : currentDpr >= 1.4 ? "1.5" : currentDpr >= 0.9 ? "1.0" : "0.75";
  }

  // Handle DPR Change
  const applyDpr = (ratio: number) => {
    try {
      if (world?.renderer?.three) {
        world.renderer.three.setPixelRatio(ratio);
        const container = document.getElementById("container");
        if (container) {
          world.renderer.three.setSize(container.clientWidth, container.clientHeight);
        }
        if (typeof (world.renderer as any).update === "function") {
          (world.renderer as any).update();
        }
      }
      updateDprDisplay(ratio);
    } catch (err) {
      console.warn("Failed to set pixel ratio:", err);
    }
  };

  // Handle Shadow Map Resolution
  const applyShadowResolution = (size: number) => {
    if (dirLight?.shadow) {
      dirLight.shadow.mapSize.width = size;
      dirLight.shadow.mapSize.height = size;
      if (dirLight.shadow.map) {
        dirLight.shadow.map.dispose();
        dirLight.shadow.map = null as any;
      }
      dirLight.shadow.needsUpdate = true;
      if (world?.renderer?.three?.shadowMap) {
        world.renderer.three.shadowMap.needsUpdate = true;
      }
      if (dirLight.shadow.camera) {
        dirLight.shadow.camera.updateProjectionMatrix();
      }
      if (world?.scene?.three) {
        try {
          if (typeof (world.scene as any).updateShadows === "function") {
            (world.scene as any).updateShadows();
          }
        } catch { /* noop */ }
      }
      if (typeof (world?.renderer as any)?.update === "function") {
        (world.renderer as any).update();
      }
    }
  };

  // Handle FXAA / Postproduction Custom Effects
  const applyFXAA = (enabled: boolean) => {
    try {
      const post = (world?.renderer as any)?.postproduction;
      if (post?.customEffects) {
        if (post.customEffects.fxaa) {
          post.customEffects.fxaa.enabled = enabled;
        }
      }
      if (typeof (world?.renderer as any)?.update === "function") {
        (world.renderer as any).update();
      }
    } catch { /* noop */ }
  };

  dprSelect?.addEventListener("change", () => {
    const val = parseFloat(dprSelect.value);
    applyDpr(val);
    if (presetSelect) presetSelect.value = "custom";
    if (typeof (window as any).showToast === "function") {
      (window as any).showToast(`Render scale calibrated to ${val}x`, "info");
    }
  });

  shadowResSelect?.addEventListener("change", () => {
    const res = parseInt(shadowResSelect.value, 10);
    applyShadowResolution(res);
    if (presetSelect) presetSelect.value = "custom";
    if (typeof (window as any).showToast === "function") {
      (window as any).showToast(`Shadow map buffer set to ${res}²`, "info");
    }
  });

  fxaaToggle?.addEventListener("change", () => {
    applyFXAA(fxaaToggle.checked);
    if (presetSelect) presetSelect.value = "custom";
  });

  presetSelect?.addEventListener("change", () => {
    const p = presetSelect.value;
    if (p === "ultra") {
      if (dprSelect) dprSelect.value = "2.0";
      if (shadowResSelect) shadowResSelect.value = "4096";
      if (fxaaToggle) fxaaToggle.checked = true;
      applyDpr(2.0);
      applyShadowResolution(4096);
      applyFXAA(true);
      if (typeof (window as any).showToast === "function") {
        (window as any).showToast("⚡ Ultra Graphics: Max HiDPI, 4K Shadows & FXAA", "success");
      }
    } else if (p === "balanced") {
      if (dprSelect) dprSelect.value = "1.5";
      if (shadowResSelect) shadowResSelect.value = "2048";
      if (fxaaToggle) fxaaToggle.checked = true;
      applyDpr(1.5);
      applyShadowResolution(2048);
      applyFXAA(true);
      if (typeof (window as any).showToast === "function") {
        (window as any).showToast("⚖ Balanced Graphics: 1.5x Scaling, 2K Shadows", "info");
      }
    } else if (p === "eco") {
      if (dprSelect) dprSelect.value = "1.0";
      if (shadowResSelect) shadowResSelect.value = "1024";
      if (fxaaToggle) fxaaToggle.checked = false;
      applyDpr(1.0);
      applyShadowResolution(1024);
      applyFXAA(false);
      if (typeof (window as any).showToast === "function") {
        (window as any).showToast("🌱 Eco Mode: 1.0x Native Display, 1K Shadows, Power Saver", "info");
      }
    }
  });

  benchBtn?.addEventListener("click", () => {
    const info = probeGPUCapabilities(world?.renderer?.three);
    const modalContent = `
<b>GPU Diagnostics & WebGL Hardware Info:</b><br/>
• <b>Card:</b> ${info.unmaskedRenderer}<br/>
• <b>Vendor:</b> ${info.unmaskedVendor}<br/>
• <b>WebGL Version:</b> ${info.glVersion}<br/>
• <b>GLSL Shader:</b> ${info.shadingLanguageVersion}<br/>
• <b>Max Texture Size:</b> ${info.maxTextureSize}px<br/>
• <b>Max Anisotropy:</b> ${info.maxAnisotropy}x<br/>
• <b>CPU Cores:</b> ${info.hardwareConcurrency} logical threads<br/>
• <b>System Memory:</b> ${info.deviceMemory}<br/>
• <b>Hardware Accelerated:</b> Yes (${info.hasDiscreteGPU ? "Dedicated Discrete GPU" : "Integrated GPU"})
    `;
    if (typeof (window as any).showToast === "function") {
      (window as any).showToast(`GPU: ${cleanName} (${info.maxTextureSize}px max texture)`, "info");
    }
    alert(modalContent.replace(/<br\/>/g, "\n").replace(/<[^>]+>/g, ""));
  });

  guideBtn?.addEventListener("click", () => {
    const guideText = `
=== OS & BROWSER GRAPHICS ACCELERATOR CONFIGURATION GUIDE ===

1. WINDOWS GRAPHICS PERFORMANCE (High Performance Discrete GPU):
   • Open Windows Settings -> System -> Display -> Graphics (or search "Graphics Settings").
   • Under "Custom options for applications", select "Desktop app" and Browse.
   • Choose your browser executable:
     - Chrome: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
     - Edge: C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe
   • Click "Options" and set GPU preference to: "High performance" (your dedicated NVIDIA/AMD GPU).
   • Click Save and restart your browser.

2. CHROME / EDGE BROWSER HARDWARE ACCELERATION:
   • Go to: chrome://settings/system (or edge://settings/system)
   • Toggle ON: "Use graphics acceleration when available".
   • Next, go to: chrome://flags (or edge://flags)
     - Search "Override software rendering list" -> Set to ENABLED.
     - Search "Choose ANGLE graphics backend" -> Set to D3D11 or D3D11on12.
     - Search "WebGPU" -> Set to ENABLED (for next-gen compute shaders).
   • Click "Relaunch" at the bottom of the page.

3. NVIDIA CONTROL PANEL (Optional for Mobile/Laptops):
   • Right-click desktop -> "NVIDIA Control Panel".
   • Go to "Manage 3D settings" -> "Program Settings".
   • Select your browser -> Set "Preferred graphics processor" to "High-performance NVIDIA processor".
   • Set "Power management mode" to "Prefer maximum performance".
    `;
    alert(guideText);
  });
}
