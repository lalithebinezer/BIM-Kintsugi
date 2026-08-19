const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace('max-width: 900px;', 'max-width: 1000px;');
fs.writeFileSync('src/style.css', css);
