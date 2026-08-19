import * as THREE from 'three';

export const BluePenShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tDepth: { value: null as THREE.Texture | null },
    tNormal: { value: null as THREE.Texture | null },
    cameraNear: { value: 0.01 },
    cameraFar: { value: 1000.0 },
    resolution: { value: new THREE.Vector2(1, 1) },
    paperColor: { value: new THREE.Color('#0A0A0C') },
    inkColor: { value: new THREE.Color('#D4FF3F') },
    outlineGlowColor: { value: new THREE.Color('#00e5ff') },
    vignetteIntensity: { value: 0.35 },
    bloomThreshold: { value: 0.75 },
    bloomStrength: { value: 0.4 },
    toonSteps: { value: 4.0 },
    lineThickness: { value: 1.2 },
    jitterAmount: { value: 0.0018 },
    postMode: { value: 0.0 }, // 0: Standard/Toon, 1: Architectural Draft, 2: Cyber/CRT Grid, 3: Pencil Sketch, 4: Matrix/Emerald Terminal
    chromaticAberration: { value: 0.0 },
    enabled: { value: 1.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform sampler2D tNormal;
    uniform vec2 resolution;
    uniform vec3 paperColor;
    uniform vec3 inkColor;
    uniform vec3 outlineGlowColor;
    uniform float vignetteIntensity;
    uniform float bloomThreshold;
    uniform float bloomStrength;
    uniform float toonSteps;
    uniform float lineThickness;
    uniform float jitterAmount;
    uniform float postMode;
    uniform float chromaticAberration;
    uniform float enabled;

    varying vec2 vUv;

    // Pseudo-random noise generator
    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    // 2D Simplex-like noise for line jitter
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = rand(i);
      float b = rand(i + vec2(1.0, 0.0));
      float c = rand(i + vec2(0.0, 1.0));
      float d = rand(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      vec4 originalColor = texture2D(tDiffuse, vUv);

      if (enabled < 0.5) {
        gl_FragColor = originalColor;
        return;
      }

      // Base smooth UV for surface cell shading
      vec2 baseUv = vUv;

      // Low-frequency organic jitter ONLY for hand-drawn edge outline sampling
      vec2 noiseCoord = vUv * 60.0;
      vec2 edgeJitter = vec2(
        noise(noiseCoord) - 0.5,
        noise(noiseCoord + vec2(17.3, 31.7)) - 0.5
      ) * (jitterAmount * 1.5);

      // Jittered UV specifically for edge detection lines
      vec2 edgeUv = vUv + edgeJitter;

      // Sobel sampling offsets (clean line thickness)
      vec2 texel = vec2(lineThickness * 1.2) / resolution;

      // Sample depth texture for sharp geometric outlines
      float depthEdge = 0.0;
      if (resolution.x > 1.0) {
        float d0 = texture2D(tDepth, edgeUv + vec2(-texel.x, -texel.y)).r;
        float d1 = texture2D(tDepth, edgeUv + vec2( 0.0,     -texel.y)).r;
        float d2 = texture2D(tDepth, edgeUv + vec2( texel.x, -texel.y)).r;
        float d3 = texture2D(tDepth, edgeUv + vec2(-texel.x,  0.0)).r;
        float d4 = texture2D(tDepth, edgeUv + vec2( texel.x,  0.0)).r;
        float d5 = texture2D(tDepth, edgeUv + vec2(-texel.x,  texel.y)).r;
        float d6 = texture2D(tDepth, edgeUv + vec2( 0.0,      texel.y)).r;
        float d7 = texture2D(tDepth, edgeUv + vec2( texel.x,  texel.y)).r;

        float depthSobelX = (d2 + 2.0 * d4 + d7) - (d0 + 2.0 * d3 + d5);
        float depthSobelY = (d0 + 2.0 * d1 + d2) - (d5 + 2.0 * d6 + d7);
        depthEdge = sqrt(depthSobelX * depthSobelX + depthSobelY * depthSobelY);
      }

      // Diffuse luminance edge fallback (jittered for hand-drawn pen lines)
      vec3 c0 = texture2D(tDiffuse, edgeUv + vec2(-texel.x, 0.0)).rgb;
      vec3 c1 = texture2D(tDiffuse, edgeUv + vec2( texel.x, 0.0)).rgb;
      vec3 c2 = texture2D(tDiffuse, edgeUv + vec2(0.0, -texel.y)).rgb;
      vec3 c3 = texture2D(tDiffuse, edgeUv + vec2(0.0,  texel.y)).rgb;
      float colorEdge = length(c1 - c0) + length(c3 - c2);

      // Edge intensity threshold for crisp hand-drawn ink outlines
      float edgeIntensity = smoothstep(0.003, 0.035, depthEdge) + smoothstep(0.12, 0.4, colorEdge);
      edgeIntensity = clamp(edgeIntensity, 0.0, 1.0);

      // --- CHROMATIC ABERRATION (Lumiere/GDX Style) ---
      if (chromaticAberration > 0.0001) {
        vec2 caOffset = (vUv - 0.5) * chromaticAberration * 0.015;
        float caR = texture2D(tDiffuse, vUv + caOffset).r;
        float caB = texture2D(tDiffuse, vUv - caOffset).b;
        originalColor.r = caR;
        originalColor.b = caB;
      }

      // Subtle warm paper background grain
      float grain = (rand(vUv * resolution) - 0.5) * 0.018;

      // Smooth surface luminance shading (un-jittered baseUv for clean faces)
      float luminance = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114));
      float toneShading = smoothstep(0.05, 0.9, luminance);

      // Dynamic cell toon shading based on theme toonSteps parameter
      float steps = max(toonSteps, 2.0);
      float cellTone = floor(toneShading * steps + 0.5) / steps;

      // Shaded faces blend cleanly between paper color and ink tone
      vec3 themeElementShade = mix(inkColor * 0.25 + paperColor * 0.45, paperColor, cellTone);

      // Mix clean smooth surface shading with edge outlines and emissive glow
      vec3 outlineColor = mix(inkColor, outlineGlowColor, 0.35);
      vec3 finalColor = mix(themeElementShade + vec3(grain), outlineColor, edgeIntensity * 0.95);

      // --- SPECIALIZED THEME MODE POST-EFFECTS ---
      // PostMode 1: Architectural Blue Draft Grid
      if (postMode > 0.5 && postMode < 1.5) {
        vec2 gridUv = vUv * resolution * 0.05;
        float gridLine = step(0.96, fract(gridUv.x)) + step(0.96, fract(gridUv.y));
        finalColor += inkColor * gridLine * 0.08;
      }
      // PostMode 2: Cyberpunk / CRT Scanlines (Lumiere/GDX CRT Style)
      else if (postMode > 1.5 && postMode < 2.5) {
        float scanline = sin(vUv.y * resolution.y * 1.5) * 0.07;
        finalColor -= vec3(scanline);
      }
      // PostMode 3: Pencil Cross-Hatching
      else if (postMode > 2.5 && postMode < 3.5) {
        float hatch1 = step(0.5, fract((vUv.x + vUv.y) * resolution.x * 0.08));
        float hatch2 = step(0.5, fract((vUv.x - vUv.y) * resolution.x * 0.08));
        if (luminance < 0.4) finalColor *= mix(0.7, 1.0, hatch1);
        if (luminance < 0.2) finalColor *= mix(0.7, 1.0, hatch2);
      }

      // --- TOP-CLASS BLOOM HIGHLIGHT PASS (Unity/pmndrs style) ---
      float bloomLuma = dot(originalColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      if (bloomLuma > bloomThreshold) {
        float bloomFactor = (bloomLuma - bloomThreshold) / (1.0 - bloomThreshold);
        finalColor += originalColor.rgb * bloomFactor * bloomStrength;
      }

      // --- VIGNETTE SHADING (Lumiere/Sundown style) ---
      vec2 uvCentered = vUv - 0.5;
      float dist = length(uvCentered);
      float vignette = smoothstep(0.75, 0.2, dist * vignetteIntensity * 2.2);
      finalColor *= vignette;

      // Keep selection/highlighting intact
      if (originalColor.g > 0.6 && originalColor.r < 0.35) {
        finalColor = mix(finalColor, originalColor.rgb, 0.85);
      }

      gl_FragColor = vec4(finalColor, originalColor.a);
    }
  `
};
