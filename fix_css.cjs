const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /\.hud-anchor-bottom-center \{[\s\S]*?\}/,
  `.hud-anchor-bottom-center {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483640;
  pointer-events: auto;
  display: flex;
  align-items: flex-end;
  gap: 1rem;
}`
);

fs.writeFileSync('src/style.css', css);
