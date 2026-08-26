const fs = require('fs');

let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /header \{\s*display: flex;\s*justify-content: space-between;\s*align-items: center;\s*background: var\(--bg-panel\);\s*backdrop-filter: [^;]+;\s*-webkit-backdrop-filter: [^;]+;\s*border: [^;]+;\s*border-radius: [^;]+;\s*padding: [^;]+;\s*height: [^;]+;\s*box-shadow: [^;]+;\s*z-index: 100;\s*pointer-events: auto !important;\s*transition: [^;]+;\s*max-width: [^;]+;\s*width: 100%;\s*margin: 0 auto;\s*flex-shrink: 0;\s*\}/,
  `header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
  padding: 1.5rem 2rem;
  z-index: 100;
  pointer-events: auto !important;
  width: 100%;
  flex-shrink: 0;
}`
);

fs.writeFileSync('src/style.css', css);
console.log('Done updating header css');
