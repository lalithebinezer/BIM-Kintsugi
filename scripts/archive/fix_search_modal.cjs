const fs = require('fs');
let fileStr = fs.readFileSync('src/ui/GlobalSearchOverlay.ts', 'utf-8');

fileStr = fileStr.replace(
  /class="bim-search-overlay hidden"/g,
  'class="ui-layer bim-search-overlay hidden"'
);

fs.writeFileSync('src/ui/GlobalSearchOverlay.ts', fileStr);

let cssStr = fs.readFileSync('src/style.css', 'utf-8');

cssStr = cssStr.replace(
  /\.bim-search-modal \{[\s\S]*?animation: modalPop 0\.22s cubic-bezier\(0\.16, 1, 0\.3, 1\) both;\n\}/,
  `.bim-search-modal {
  width: 100%;
  max-width: 960px;
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  max-height: 85vh;
  box-shadow: var(--shadow-float);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
}`
);

fs.writeFileSync('src/style.css', cssStr);
console.log('Fixed search modal overlay wrapper');
