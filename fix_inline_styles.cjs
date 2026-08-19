const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

html = html.replace(/ style="background: var\(--bg-card\); color: var\(--text-primary\); border-color: var\(--border-strong\); display: flex; align-items: center; gap: 0\.35rem; font-weight: 800;"/g, '');

fs.writeFileSync('index.html', html);
console.log('Removed inline styles');
