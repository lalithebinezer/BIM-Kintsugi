const fs = require('fs');

let fileStr = fs.readFileSync('src/core/CustomViewManager.ts', 'utf-8');

fileStr = fileStr.replace(
  /<div style="padding: 0.5rem 0.6rem; border-bottom: 2px solid #000000; display: flex; justify-content: space-between; align-items: center; background: var\(--bg-hover\);">/,
  '<div style="padding: 0.85rem 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-panel-header);">'
);

fs.writeFileSync('src/core/CustomViewManager.ts', fileStr);
console.log('Fixed CustomViewManager header styles');
