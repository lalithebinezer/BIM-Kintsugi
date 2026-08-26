const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /\.btn-quick-view \{[\s\S]*?\}/,
  `.btn-quick-view {
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
  /\.btn-quick-view:hover \{[\s\S]*?\}/,
  `.btn-quick-view:hover {
  background: rgba(255,255,255,0.1);
  border-color: var(--accent-500);
}`
);

fs.writeFileSync('src/style.css', css);
console.log('Quick View btn updated');
