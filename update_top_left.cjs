const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /\.hud-anchor-top-left \{[\s\S]*?\}/,
  `.hud-anchor-top-left {
  position: absolute;
  top: 5rem;
  left: calc(320px + 2rem);
  transform: none;
  bottom: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 90;
  pointer-events: auto;
  transition: left var(--ease-normal);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  padding: 0.6rem;
  border-radius: 20px;
}`
);

fs.writeFileSync('src/style.css', css);
console.log('Top Left HUD updated');
