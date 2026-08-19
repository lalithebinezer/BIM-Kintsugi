const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /\.btn-shortcuts-toggle \{[\s\S]*?\}/,
  `.btn-shortcuts-toggle {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  padding: 0.5rem 1rem;
  height: auto;
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
  /\.btn-shortcuts-toggle:hover \{[\s\S]*?\}/,
  `.btn-shortcuts-toggle:hover {
  background: rgba(255,255,255,0.1);
  border-color: var(--accent-500);
}`
);

css = css.replace(
  /\.btn-4d-mode \{[\s\S]*?\}/,
  `.btn-4d-mode {
  background: var(--accent-500);
  border: none;
  color: black;
  padding: 0.5rem 1rem;
  height: auto;
  border-radius: 14px;
  font-size: 0.75rem;
  font-weight: 800;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
}`
);

fs.writeFileSync('src/style.css', css);
console.log('Header buttons updated');
