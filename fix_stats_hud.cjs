const fs = require('fs');

// 1. Update CSS
let css = fs.readFileSync('src/style.css', 'utf-8');
css = css.replace(
  /\.model-stats-hud \{[\s\S]*?\}/,
  `.model-stats-hud {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  border: 1px solid var(--border-color);
  border-radius: 30px;
  padding: 0.4rem 1rem;
  box-shadow: var(--shadow-float);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  pointer-events: none;
  height: max-content;
}`
);
fs.writeFileSync('src/style.css', css);

// 2. Update HTML
let html = fs.readFileSync('index.html', 'utf-8');
const statsRegex = /<!-- Model Statistics HUD -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
// Wait, the stats block I moved was this:
const newStatsHtml = `<!-- Model Statistics HUD -->
    <div id="model-stats-hud" class="model-stats-hud">
      <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--accent-500); font-weight: 700;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        Stats
      </div>
      <div style="width: 1px; height: 16px; background: var(--border-color);"></div>
      <div style="display: flex; gap: 1rem; font-weight: 600;">
        <div style="display: flex; gap: 0.35rem; align-items: center;"><span style="color: var(--text-muted);">FPS</span> <strong id="hud-fps" style="font-family: monospace; font-size: 0.7rem;">0</strong></div>
        <div style="display: flex; gap: 0.35rem; align-items: center;"><span style="color: var(--text-muted);">Ent</span> <strong id="hud-entities" style="font-family: monospace; font-size: 0.7rem;">0</strong></div>
        <div style="display: flex; gap: 0.35rem; align-items: center;"><span style="color: var(--text-muted);">Poly</span> <strong id="hud-polygons" style="font-family: monospace; font-size: 0.7rem;">0</strong></div>
      </div>
    </div>`;

// Replace the old model-stats-hud div completely
html = html.replace(/<!-- Model Statistics HUD -->[\s\S]*?<div class="bottom-toolbar"/, newStatsHtml + '\n        <div class="bottom-toolbar"');
fs.writeFileSync('index.html', html);
console.log('Fixed model stats hud formatting');
