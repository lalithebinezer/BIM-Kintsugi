const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /\.btn-sidebar-toggle \{[\s\S]*?\}/,
  `.btn-sidebar-toggle {
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}`
);

css = css.replace(
  /\.btn-sidebar-toggle:hover \{[\s\S]*?\}/,
  `.btn-sidebar-toggle:hover {
  background: rgba(255,255,255,0.1);
  border-color: var(--accent-500);
  color: var(--accent-500);
}`
);

fs.writeFileSync('src/style.css', css);
console.log('Sidebar toggle btn updated');
