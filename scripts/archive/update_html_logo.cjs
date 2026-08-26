const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

html = html.replace(
  /<div class="brand-logo">[\s\S]*?<\/div>/,
  `<div class="brand-logo">
            <div>K</div>
          </div>`
);

html = html.replace(
  /<h1>BIM Kintsugi <span class="brand-badge">Zen Infrastructure<\/span><\/h1>/,
  `<h1>BIM Kintsugi <span class="brand-badge">PRO CLOUD</span></h1>`
);

fs.writeFileSync('index.html', html);
console.log('Logo updated');
