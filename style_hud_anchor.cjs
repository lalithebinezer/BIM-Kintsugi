const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

// Replace standard left positioning with bottom-center anchoring
css = css.replace('.hud-anchor-top-left {\n  position: absolute;\n  top: 4.5rem;\n  left: calc(320px + 2rem);', '.hud-anchor-top-left {\n  position: absolute;\n  bottom: 2rem;\n  left: 50%;\n  transform: translateX(-50%);\n  top: auto;');

// Remove dynamic transitions on collapse that conflict with bottom centering
css = css.replace('body.left-sidebar-collapsed .hud-anchor-top-left {\n  left: 1rem;\n}', 'body.left-sidebar-collapsed .hud-anchor-top-left {\n  /* left: 50%; handled by base class */\n}');

fs.writeFileSync('src/style.css', css);
