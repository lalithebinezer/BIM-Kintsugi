const fs = require('fs');
const css = `
.search-shortcut-kbd {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 0.15rem 0.35rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
`;
fs.appendFileSync('src/style.css', css);
console.log('Appended missing search-shortcut-kbd CSS');
