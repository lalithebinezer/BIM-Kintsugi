const fs = require('fs');
let cssStr = fs.readFileSync('src/style.css', 'utf-8');

if (!cssStr.includes('.bim-search-modal {\n  width: 100%;')) {
  cssStr = cssStr.replace('.bim-search-header {', 
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
  pointer-events: auto;
  animation: modalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.bim-search-header {`);
  fs.writeFileSync('src/style.css', cssStr);
  console.log('Successfully injected .bim-search-modal');
} else {
  console.log('Already has .bim-search-modal');
}
