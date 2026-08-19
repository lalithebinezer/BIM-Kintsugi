const fs = require('fs');

let fileStr = fs.readFileSync('src/core/CustomViewManager.ts', 'utf-8');

fileStr = fileStr.replace(
  /background: var\(--bg-card\); border: 2px solid #000000; box-shadow: 2px 2px 0px #000000; border-radius: 2px;/g,
  'background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px;'
);
fileStr = fileStr.replace(
  /border-radius: 2px;/g, // catch the badges
  'border-radius: 4px;'
);

fs.writeFileSync('src/core/CustomViewManager.ts', fileStr);
console.log('Fixed CustomViewManager chip styles');
