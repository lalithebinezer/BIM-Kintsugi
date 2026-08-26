const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace('.hud-anchor-top-left,\n  .hud-anchor-bottom-right {\n    grid-column: 1 !important;\n    grid-row: 2 !important;\n  }', '.hud-anchor-top-left,\n  .hud-anchor-bottom-right {\n    grid-column: 1 !important;\n    grid-row: 2 !important;\n  }\n\n  .hud-anchor-top-left {\n    position: absolute;\n    top: 5rem;\n    left: 1rem;\n  }');

fs.writeFileSync('src/style.css', css);
console.log("Fixed mobile HUD positioning");
