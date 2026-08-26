const fs = require('fs');

let css = fs.readFileSync('src/style.css', 'utf-8');

// Fix Left/Right sidebars z-index and styles
css = css.replace(/\.left-sidebar \{\s*position: absolute;\s*top: 5rem;\s*left: 1rem;\s*bottom: 1rem;\s*width: 320px;\s*transition: transform var\(--ease-normal\), opacity var\(--ease-normal\);\s*pointer-events: auto;\s*\}/,
`.left-sidebar {
  position: absolute;
  top: 4.5rem;
  left: 1rem;
  bottom: 1rem;
  width: 320px;
  z-index: 100;
  transition: transform var(--ease-normal), opacity var(--ease-normal), left var(--ease-normal);
  pointer-events: auto;
}`);

css = css.replace(/\.right-sidebar \{\s*position: absolute;\s*top: 5rem;\s*right: 1rem;\s*bottom: 1rem;\s*width: 360px;\s*transition: transform var\(--ease-normal\), opacity var\(--ease-normal\);\s*pointer-events: auto;\s*\}/,
`.right-sidebar {
  position: absolute;
  top: 4.5rem;
  right: 1rem;
  bottom: 1rem;
  width: 360px;
  z-index: 100;
  transition: transform var(--ease-normal), opacity var(--ease-normal), right var(--ease-normal);
  pointer-events: auto;
}`);

// Fix View Cube position
css = css.replace(/\.view-cube-layer \{\s*pointer-events: none;\s*position: absolute;\s*top: 5rem;\s*right: 1rem;\s*\}/,
`.view-cube-layer {
  pointer-events: none;
  position: absolute;
  top: 4.5rem;
  right: calc(360px + 2rem);
  transition: right var(--ease-normal);
  z-index: 90;
}`);

// Fix Top Left HUD position
css = css.replace(/\.hud-anchor-top-left \{\s*position: absolute;\s*top: 5rem;\s*left: calc\(320px \+ 2rem\);\s*display: flex;\s*flex-direction: column;\s*gap: 0\.5rem;\s*z-index: 50;\s*pointer-events: auto;\s*\}/,
`.hud-anchor-top-left {
  position: absolute;
  top: 4.5rem;
  left: calc(320px + 2rem);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 90;
  pointer-events: auto;
  transition: left var(--ease-normal);
}`);

// Fix Model Stats HUD position
css = css.replace(/\.model-stats-hud \{\s*position: fixed;\s*bottom: 1\.5rem;\s*left: 1\.5rem;\s*z-index: 10000;/,
`.model-stats-hud {
  position: absolute;
  bottom: 1rem;
  left: calc(320px + 2rem);
  z-index: 90;
  transition: left var(--ease-normal);`);

// Fix Toast Container position
css = css.replace(/\.bim-toast-container \{\s*position: fixed;\s*bottom: 1\.5rem;\s*right: 1\.5rem;\s*z-index: 100010;/,
`.bim-toast-container {
  position: absolute;
  bottom: 1rem;
  right: calc(360px + 2rem);
  z-index: 110;
  transition: right var(--ease-normal);`);

// Add dynamic state overrides for stats and toasts
css += `
body.left-sidebar-collapsed .model-stats-hud {
  left: 1rem;
}
body.right-sidebar-collapsed .bim-toast-container {
  right: 1rem;
}
`;

fs.writeFileSync('src/style.css', css);
