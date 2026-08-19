const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const statsMatch = html.match(/<!-- Model Statistics HUD -->[\s\S]*?<\/div>\s*<!-- Toast Notification Feed -->/);
if (statsMatch) {
  let statsBlock = statsMatch[0].replace('    <!-- Toast Notification Feed -->', '');
  html = html.replace(statsBlock, '');
  
  html = html.replace('<div class="bottom-toolbar"', statsBlock + '\n        <div class="bottom-toolbar"');
  fs.writeFileSync('index.html', html);
  console.log('Moved stats block');
} else {
  console.log('Could not find stats block');
}
