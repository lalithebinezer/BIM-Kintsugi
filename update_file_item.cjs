const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /\.file-item \{[\s\S]*?\}/,
  `.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border-color);
  padding: 1rem;
  border-radius: 16px;
  transition: all var(--ease-fast);
  cursor: pointer;
}`
);

css = css.replace(
  /\.file-item:hover \{[\s\S]*?\}/,
  `.file-item:hover {
  border-color: var(--accent-500);
  transform: translateY(-1px);
}`
);

fs.writeFileSync('src/style.css', css);
console.log('File item updated');
