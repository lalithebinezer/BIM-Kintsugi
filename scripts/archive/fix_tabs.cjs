const fs = require('fs');

let css = fs.readFileSync('src/style.css', 'utf-8');

const insertion = `
.help-tab-panel {
  display: none;
  animation: fadePanel 0.2s ease-out both;
}

.help-tab-panel.active {
  display: block;
}

@keyframes fadePanel {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

css = css.replace(/\.help-modal-body \{/, insertion + '\n.help-modal-body {');
fs.writeFileSync('src/style.css', css);
