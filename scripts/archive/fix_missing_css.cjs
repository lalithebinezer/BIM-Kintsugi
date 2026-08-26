const fs = require('fs');
let cssStr = fs.readFileSync('src/style.css', 'utf-8');

if (!cssStr.includes('.bim-search-minimized-pill {')) {
  cssStr += `

/* Global Search Minimized Pill */
.bim-search-minimized-pill {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 99999;
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  border: 1px solid var(--border-color);
  border-radius: 30px;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  box-shadow: var(--shadow-float);
  cursor: pointer;
  animation: fadeIn 0.2s ease-out both;
  transition: all 0.2s;
  pointer-events: auto;
}

.bim-search-minimized-pill:hover {
  background: var(--bg-surface);
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

.bim-search-minimized-pill.hidden {
  display: none !important;
}

#minimized-pill-label {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--text-primary);
}

.minimized-pill-count {
  background: var(--bg-card);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.btn-pill-expand {
  background: transparent;
  border: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.btn-pill-expand:hover {
  color: var(--text-primary);
}
`;
  fs.writeFileSync('src/style.css', cssStr);
  console.log('Added missing pill CSS');
} else {
  console.log('Pill CSS already exists');
}
