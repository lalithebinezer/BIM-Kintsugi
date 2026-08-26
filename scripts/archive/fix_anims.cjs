const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

// Remove display:none for sidebars so the transform transition works
css = css.replace(/body\.left-sidebar-collapsed \.left-sidebar \{\s*display: none;\s*\}/g, '');
css = css.replace(/body\.right-sidebar-collapsed \.right-sidebar \{\s*display: none;\s*\}/g, '');

fs.writeFileSync('src/style.css', css);
