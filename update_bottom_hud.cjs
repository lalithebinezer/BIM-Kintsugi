const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /\.bottom-toolbar \{[\s\S]*?\}/,
  `.bottom-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 0.6rem;
  box-shadow: var(--shadow-float);
  transition: transform var(--ease-spring), opacity var(--ease-normal);
}`
);

css = css.replace(
  /\.btn-tool \{[\s\S]*?\}/,
  `.btn-tool {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  padding: 0.5rem 1rem;
  border-radius: 14px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
}`
);

css = css.replace(
  /\.btn-tool:hover \{[\s\S]*?\}/,
  `.btn-tool:hover {
  background: rgba(255,255,255,0.1);
  border-color: var(--accent-500);
}`
);

fs.writeFileSync('src/style.css', css);
console.log('Bottom HUD updated');
