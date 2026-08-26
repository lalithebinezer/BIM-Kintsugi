const fs = require('fs');

let css = fs.readFileSync('src/style.css', 'utf-8');

// Ensure HUD and View Cube adjust dynamically based on sidebar state
css += `
/* Dynamic Spacing Adjustments */
body.left-sidebar-collapsed .left-sidebar {
  transform: translateX(-150%);
  opacity: 0;
  pointer-events: none;
}

body.right-sidebar-collapsed .right-sidebar {
  transform: translateX(150%);
  opacity: 0;
  pointer-events: none;
}
`;

fs.writeFileSync('src/style.css', css);
