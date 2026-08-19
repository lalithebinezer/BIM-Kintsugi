const fs = require('fs');

let css = fs.readFileSync('src/style.css', 'utf-8');

css += `
/* Responsive Bottom Toolbar */
@media (max-width: 1400px) {
  .btn-tool span {
    display: none;
  }
  .btn-tool {
    padding: 0.35rem 0.45rem;
  }
}
@media (max-width: 768px) {
  .hud-anchor-bottom-center {
    display: none !important;
  }
}
`;

fs.writeFileSync('src/style.css', css);
