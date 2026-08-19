const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(/\.bim-breadcrumbs-bar \{[\s\S]*?\}/, 
`.bim-breadcrumbs-bar {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.2rem 0.2rem;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  max-width: 520px;
}`);

fs.writeFileSync('src/style.css', css);
