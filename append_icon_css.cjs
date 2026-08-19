const fs = require('fs');
const css = `
.search-input-icon {
  color: var(--accent-500);
  flex-shrink: 0;
}
`;
fs.appendFileSync('src/style.css', css);
console.log('Appended missing search-input-icon CSS');
