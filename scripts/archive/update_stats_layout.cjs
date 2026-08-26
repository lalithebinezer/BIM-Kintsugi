const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /\.hud-anchor-bottom-center \{[\s\S]*?\}/,
  `.hud-anchor-bottom-center {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483640;
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}`
);

css = css.replace(
  /\.model-stats-hud \{[\s\S]*?\}/,
  `.model-stats-hud {
  position: relative;
  z-index: 60;
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.65rem 0.85rem;
  box-shadow: var(--shadow-sm);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.72rem;
  min-width: 170px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: none;
}`
);

fs.writeFileSync('src/style.css', css);

let html = fs.readFileSync('index.html', 'utf-8');
// Move model-stats-hud inside hud-anchor-bottom-center
// First find model-stats-hud block
const statsMatch = html.match(/<!-- Model Statistics HUD -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/);
if (statsMatch) {
  let statsBlock = statsMatch[0];
  // Remove it from its current position
  html = html.replace(statsBlock, '');
  
  // Insert it before bottom-toolbar
  html = html.replace('<div class="bottom-toolbar"', statsBlock + '\n        <div class="bottom-toolbar"');
  fs.writeFileSync('index.html', html);
  console.log('Moved stats block');
} else {
  console.log('Could not find stats block');
}
