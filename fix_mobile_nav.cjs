const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

if (!css.includes('.mobile-bottom-nav {\n  display: none;')) {
  css = css.replace('/* Mobile responsive drawer */', '.mobile-bottom-nav { display: none; }\n/* Mobile responsive drawer */');
  fs.writeFileSync('src/style.css', css);
  console.log("Added display:none for desktop");
}
