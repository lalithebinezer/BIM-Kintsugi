const fs = require('fs');

// 1. Fix HTML
let html = fs.readFileSync('index.html', 'utf-8');
html = html.replace(
  /<div class="saved-views-flyout hidden" id="menu-saved-views" style="[^"]*">/,
  '<div class="saved-views-flyout hidden" id="menu-saved-views" style="position: absolute; top: calc(100% + 12px); right: 0; width: 360px; z-index: 10000; overflow: hidden;">'
);
fs.writeFileSync('index.html', html);

// 2. Fix CSS
let css = fs.readFileSync('src/style.css', 'utf-8');
css = css.replace(
  /\.saved-views-flyout \{[\s\S]*?\}/,
  `.saved-views-flyout {
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-float);
  border-radius: 12px;
  overflow: hidden;
  animation: modalPop 0.18s cubic-bezier(0.16, 1, 0.3, 1) both;
}`
);
fs.writeFileSync('src/style.css', css);
console.log('Fixed saved views flyout style');
