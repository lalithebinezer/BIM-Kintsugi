const fs = require('fs');
let fileStr = fs.readFileSync('src/ui/GlobalSearchOverlay.ts', 'utf-8');

fileStr = fileStr.replace(
  '<div class="bim-search-input-wrapper">',
  '<div class="bim-search-tools-section">'
);

fileStr = fileStr.replace(
  '<div class="bim-search-input-box">',
  '<div class="bim-search-input-wrapper">'
);

fs.writeFileSync('src/ui/GlobalSearchOverlay.ts', fileStr);
console.log('Fixed wrapper classes in TS');
