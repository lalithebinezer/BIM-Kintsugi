const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace('.sidebar {\n  display: flex;\n  flex-direction: column;\n  gap: 0.6rem;\n  height: 100%;\n  min-height: 0;\n  overflow: hidden;\n  z-index: 15;\n}', '.sidebar {\n  display: flex;\n  flex-direction: column;\n  gap: 0.6rem;\n  min-height: 0;\n  overflow: hidden;\n  z-index: 15;\n}');

fs.writeFileSync('src/style.css', css);
console.log("Fixed sidebar height issue");
