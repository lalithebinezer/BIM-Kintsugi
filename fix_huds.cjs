const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

// Replace top-left positioning
css = css.replace('.hud-anchor-top-left {\n  position: absolute;\n  bottom: 2rem;\n  left: 50%;\n  transform: translateX(-50%);\n  top: auto;', '.hud-anchor-top-left {\n  position: absolute;\n  top: 5rem;\n  left: calc(320px + 2rem);\n  transform: none;\n  bottom: auto;');

// Handle left sidebar collapsed state for top-left hud
css = css.replace('body.left-sidebar-collapsed .hud-anchor-top-left {\n  /* left: 50%; handled by base class */\n}', 'body.left-sidebar-collapsed .hud-anchor-top-left {\n  left: 2rem;\n}');

fs.writeFileSync('src/style.css', css);
console.log("Fixed HUD overlaps");
