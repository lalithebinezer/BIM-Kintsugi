const fs = require('fs');

let css = fs.readFileSync('src/style.css', 'utf-8');

// Hide tactical ticker bar globally
css = css.replace(/\.tactical-ticker-bar \{\s*position: fixed;/g,
`.tactical-ticker-bar {
  display: none !important;
  position: fixed;`);

fs.writeFileSync('src/style.css', css);
