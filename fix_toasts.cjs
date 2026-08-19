const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

// Change toast container position
css = css.replace(/\.bim-toast-container \{\s*position: absolute;\s*bottom: 1rem;\s*right: calc\(360px \+ 2rem\);\s*z-index: 110;\s*transition: right var\(--ease-normal\);\s*display: flex;\s*flex-direction: column;\s*gap: 0\.5rem;\s*pointer-events: none;\s*\}/,
`.bim-toast-container {
  position: absolute;
  top: 6rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100010;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}`);

// Remove dynamic override for toast container
css = css.replace(/body\.right-sidebar-collapsed \.bim-toast-container \{\s*right: 1rem;\s*\}/, '');

fs.writeFileSync('src/style.css', css);
