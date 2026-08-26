const fs = require('fs');
let fileStr = fs.readFileSync('src/ui/GlobalSearchOverlay.ts', 'utf-8');

fileStr = fileStr.replace(
  /className = "ui-layer bim-search-overlay hidden";/g,
  'className = "bim-search-overlay hidden";'
);

fs.writeFileSync('src/ui/GlobalSearchOverlay.ts', fileStr);
console.log('Reverted overlayEl className');
