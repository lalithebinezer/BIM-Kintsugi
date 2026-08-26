const fs = require('fs');

let css = fs.readFileSync('src/style.css', 'utf-8');

// Update .ui-layer grid layout
css = css.replace(/\.ui-layer \{\s*position: absolute;\s*inset: 0;\s*z-index: 10;\s*pointer-events: none;\s*display: grid;\s*grid-template-columns: 340px 1fr 370px;\s*grid-template-rows: 58px 1fr 34px;\s*padding: 0\.75rem;\s*gap: 0\.75rem;\s*\}/, 
`.ui-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
}`);

// Command Island Header
css = css.replace(/header \{\s*grid-column: 1 \/ 4;\s*display: flex;\s*justify-content: space-between;\s*align-items: center;\s*background: var\(--bg-panel\);\s*backdrop-filter: blur\(var\(--glass-blur\)\) saturate\(190%\);\s*-webkit-backdrop-filter: blur\(var\(--glass-blur\)\) saturate\(190%\);\s*border: 1px solid var\(--border-color\);\s*border-radius: 12px;\s*padding: 0 1\.1rem;\s*height: 100%;\s*box-shadow: var\(--shadow-float\);\s*z-index: 100;\s*pointer-events: auto !important;\s*transition: var\(--theme-transition\);\s*\}/,
`header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  border: 1px solid var(--border-color);
  border-radius: 40px;
  padding: 0 1.25rem;
  height: 52px;
  box-shadow: var(--shadow-sm);
  z-index: 100;
  pointer-events: auto !important;
  transition: var(--theme-transition);
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  flex-shrink: 0;
}`);

// Left Sidebar -> Slim Dock
css = css.replace(/\.left-sidebar \{\s*grid-column: 1;\s*transition: transform var\(--ease-normal\), opacity var\(--ease-normal\);\s*\}/,
`.left-sidebar {
  position: absolute;
  top: 5rem;
  left: 1rem;
  bottom: 1rem;
  width: 320px;
  transition: transform var(--ease-normal), opacity var(--ease-normal);
  pointer-events: auto;
}`);

// Right Sidebar -> Floating Contextual Panel
css = css.replace(/\.right-sidebar \{\s*grid-column: 3;\s*transition: transform var\(--ease-normal\), opacity var\(--ease-normal\);\s*\}/,
`.right-sidebar {
  position: absolute;
  top: 5rem;
  right: 1rem;
  bottom: 1rem;
  width: 360px;
  transition: transform var(--ease-normal), opacity var(--ease-normal);
  pointer-events: auto;
}`);

css = css.replace(/\.view-cube-layer \{\s*pointer-events: none;\s*position: relative;\s*grid-column: 2;\s*grid-row: 2;\s*\}/,
`.view-cube-layer {
  pointer-events: none;
  position: absolute;
  top: 5rem;
  right: 1rem;
}`);

css = css.replace(/\.hud-anchor-top-left \{\s*grid-column: 2;\s*grid-row: 2;\s*justify-self: start;\s*align-self: start;\s*display: flex;\s*flex-direction: column;\s*gap: 0\.5rem;\s*z-index: 50;\s*pointer-events: auto;\s*\}/,
`.hud-anchor-top-left {
  position: absolute;
  top: 5rem;
  left: calc(320px + 2rem);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 50;
  pointer-events: auto;
}`);

css = css.replace(/\.hud-anchor-bottom-center \{\s*grid-column: 2;\s*grid-row: 2;\s*justify-self: center;\s*align-self: end;\s*z-index: 50;\s*pointer-events: auto;\s*margin-bottom: 0\.25rem;\s*\}/,
`.hud-anchor-bottom-center {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  pointer-events: auto;
}`);

css = css.replace(/\.hud-anchor-bottom-right \{\s*grid-column: 2;\s*grid-row: 2;\s*justify-self: end;\s*align-self: end;\s*display: flex;\s*flex-direction: column;\s*align-items: flex-end;\s*gap: 0\.5rem;\s*z-index: 50;\s*pointer-events: auto;\s*\}/,
`.hud-anchor-bottom-right {
  position: absolute;
  bottom: 1rem;
  right: calc(360px + 2rem);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  z-index: 50;
  pointer-events: auto;
}`);

// Hide panels if collapsed via body classes
css += `
body.left-sidebar-collapsed .hud-anchor-top-left {
  left: 1rem;
}
body.right-sidebar-collapsed .hud-anchor-bottom-right {
  right: 1rem;
}
body.right-sidebar-collapsed .view-cube-layer {
  right: 1rem;
}
`;

fs.writeFileSync('src/style.css', css);
