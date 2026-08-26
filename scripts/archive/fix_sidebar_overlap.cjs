const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /\.left-sidebar \{[\s\S]*?\}/,
  `.left-sidebar {
  position: absolute;
  top: 4.5rem;
  left: 1rem;
  bottom: 5rem;
  width: 320px;
  z-index: 100;
  transition: transform var(--ease-normal), opacity var(--ease-normal), left var(--ease-normal);
  pointer-events: auto;
}`
);

css = css.replace(
  /\.right-sidebar \{[\s\S]*?\}/,
  `.right-sidebar {
  position: absolute;
  top: 4.5rem;
  right: 1rem;
  bottom: 5rem;
  width: 360px;
  z-index: 100;
  transition: transform var(--ease-normal), opacity var(--ease-normal), right var(--ease-normal);
  pointer-events: auto;
}`
);

fs.writeFileSync('src/style.css', css);
console.log('Fixed sidebar bottoms');
