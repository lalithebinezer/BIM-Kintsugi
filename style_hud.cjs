const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(/\.hud-anchor-top-left \{[\s\S]*?\}/, 
`.hud-anchor-top-left {
  position: absolute;
  top: 4.5rem;
  left: calc(320px + 2rem);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 90;
  pointer-events: auto;
  transition: left var(--ease-normal);
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.5rem;
  box-shadow: var(--shadow-sm);
}`);

css = css.replace(/\.quick-view-toolbar \{[\s\S]*?\}/, 
`.quick-view-toolbar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}`);

css = css.replace(/\.btn-quick-view \{[\s\S]*?\}/, 
`.btn-quick-view {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.35rem 0.7rem;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: var(--font-body);
  color: var(--text-main);
  cursor: pointer;
  transition: all var(--ease-fast);
  white-space: nowrap;
}`);

fs.writeFileSync('src/style.css', css);
