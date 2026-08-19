import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { BluePenShader } from "../shaders/BluePenShader";

export class SceneManager {
  private static instance: SceneManager | null = null;
  public bluePenPass: ShaderPass | null = null;
  public world: any = null;

  private constructor() {}

  public static getInstance(): SceneManager {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager();
    }
    return SceneManager.instance;
  }

  public get postproduction(): any {
    return this.world?.renderer?.postproduction ?? null;
  }

  public initPostProcessing(world: any) {
    this.world = world;
    const postproduction = (world.renderer as any).postproduction;
    if (postproduction) {
      const postProcToggle = document.getElementById("settings-toggle-postproc") as HTMLInputElement | null;
      const isEnabled = postProcToggle ? postProcToggle.checked : false;
      try {
        postproduction.enabled = isEnabled;
      } catch (e) {
        // Base pass initialized lazily by @thatopen/components
        console.warn("Postproduction base pass lazy initialization:", e);
      }
      if (postproduction.composer) {
        this.bluePenPass = new ShaderPass(BluePenShader as any);
        if (postproduction.depthTexture) {
          this.bluePenPass.uniforms.tDepth.value = postproduction.depthTexture;
        }
        this.bluePenPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
        this.bluePenPass.uniforms.enabled.value = isEnabled ? 1.0 : 0.0;
        postproduction.composer.addPass(this.bluePenPass);
        this.syncPostProcessingWithTheme('zen');
      }
    }
  }

  public syncPostProcessingWithTheme(_themeName: string) {
    if (!this.bluePenPass) return;
    
    this.bluePenPass.uniforms.paperColor.value.setStyle("#091012");
    this.bluePenPass.uniforms.inkColor.value.setStyle("#00e5ff");
    this.bluePenPass.uniforms.outlineGlowColor.value.setStyle("#0088ff");
    this.bluePenPass.uniforms.vignetteIntensity.value = 1.0;
    this.bluePenPass.uniforms.bloomThreshold.value = 0.85;
    this.bluePenPass.uniforms.bloomStrength.value = 0.5;
    this.bluePenPass.uniforms.toonSteps.value = 8.0;
    this.bluePenPass.uniforms.lineThickness.value = 1.0;
    this.bluePenPass.uniforms.jitterAmount.value = 0.0008;
    this.bluePenPass.uniforms.postMode.value = 3;
    this.bluePenPass.uniforms.chromaticAberration.value = 0.0015;

    // Sync UI Controls & Badges while respecting user's toggle state
    const postProcToggle = document.getElementById("settings-toggle-postproc") as HTMLInputElement | null;
    const postproduction = this.postproduction;
    const isEnabled = postProcToggle ? postProcToggle.checked : false;
    if (postproduction) {
      try {
        postproduction.enabled = isEnabled;
      } catch (e) {
        // Base pass initialized lazily by @thatopen/components
        console.warn("Postproduction base pass lazy initialization:", e);
      }
    }
    if (this.bluePenPass) {
      this.bluePenPass.uniforms.enabled.value = isEnabled ? 1.0 : 0.0;
    }
    if (postProcToggle) {
      postProcToggle.checked = isEnabled;
    }

    const thicknessInput = document.getElementById("settings-postproc-thickness") as HTMLInputElement | null;
    const thicknessVal = document.getElementById("val-postproc-thickness");
    if (thicknessInput) thicknessInput.value = "1.0";
    if (thicknessVal) thicknessVal.innerText = "1.0";

    const jitterInput = document.getElementById("settings-postproc-jitter") as HTMLInputElement | null;
    const jitterVal = document.getElementById("val-postproc-jitter");
    if (jitterInput) jitterInput.value = "0.0008";
    if (jitterVal) jitterVal.innerText = "0.0008";

    const bloomInput = document.getElementById("settings-postproc-bloom") as HTMLInputElement | null;
    const bloomVal = document.getElementById("val-postproc-bloom");
    if (bloomInput) bloomInput.value = "0.5";
    if (bloomVal) bloomVal.innerText = "0.50";

    const vignetteInput = document.getElementById("settings-postproc-vignette") as HTMLInputElement | null;
    const vignetteVal = document.getElementById("val-postproc-vignette");
    if (vignetteInput) vignetteInput.value = "1.0";
    if (vignetteVal) vignetteVal.innerText = "1.00";

    const chromaInput = document.getElementById("settings-postproc-chroma") as HTMLInputElement | null;
    const chromaVal = document.getElementById("val-postproc-chroma");
    if (chromaInput) chromaInput.value = "0.0015";
    if (chromaVal) chromaVal.innerText = "0.00";

    const toonInput = document.getElementById("settings-postproc-toon") as HTMLInputElement | null;
    const toonVal = document.getElementById("val-postproc-toon");
    if (toonInput) toonInput.value = "8.0";
    if (toonVal) toonVal.innerText = "8.0";

    const fxModeInput = document.getElementById("settings-postproc-fxmode") as HTMLSelectElement | null;
    if (fxModeInput) fxModeInput.value = "3";
  }
}
