const fs = require('fs');

let css = fs.readFileSync('src/style.css', 'utf-8');

const helpCSS = `
/* ============================================================
   HELP & GUIDE MODAL CONTENTS
   ============================================================ */

/* Welcome Tab */
.welcome-hero {
  text-align: center;
  padding: 0.5rem 0 1.5rem;
}
.welcome-badge {
  display: inline-block;
  background: var(--accent-glow);
  color: var(--accent-500);
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 1px;
  margin-bottom: 0.75rem;
  border: 1px solid var(--border-accent);
}
.welcome-tagline {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
  max-width: 480px;
  margin: 0 auto;
}
.help-section-title {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--text-dim);
  text-transform: uppercase;
  margin-bottom: 0.75rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--border-subtle);
}

/* Tools Tab */
.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
.tool-card {
  display: flex;
  gap: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 1rem;
  border-radius: 10px;
  align-items: flex-start;
}
.tool-icon {
  color: var(--accent-400);
  flex-shrink: 0;
  background: var(--bg-surface);
  padding: 0.4rem;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}
.tool-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.tool-name {
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--text-primary);
}
.tool-desc {
  font-size: 0.7rem;
  color: var(--text-muted);
  line-height: 1.4;
}

/* Shortcuts Tab */
.shortcuts-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}
.shortcut-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 0.35rem;
}
.shortcut-row:last-child {
  border-bottom: none;
}
.shortcut-row kbd, .kbd-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 700;
  background: var(--bg-input);
  border: 1px solid var(--border-strong);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  color: var(--text-primary);
  box-shadow: 0 1px 0 var(--border-strong);
}
.shortcut-row span {
  color: var(--text-muted);
}

/* Navigate Tab */
.nav-mode-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.nav-mode-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 1rem;
  border-radius: 10px;
}
.nav-mode-name {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--accent-400);
  margin-bottom: 0.35rem;
  display: flex;
  align-items: center;
}
.nav-mode-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 0.65rem;
}
.nav-mode-tip {
  font-size: 0.7rem;
  color: var(--text-dim);
  font-style: italic;
}
.nav-mode-tip kbd {
  font-family: var(--font-mono);
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.6rem;
  margin: 0 0.2rem;
  font-style: normal;
}
.tip-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.tip-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  font-size: 0.75rem;
  color: var(--text-primary);
  line-height: 1.4;
}
.tip-icon {
  color: var(--accent-500);
  flex-shrink: 0;
}
.tip-item kbd, .tool-desc kbd {
  font-family: var(--font-mono);
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.65rem;
}

/* Footer */
.help-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-strong);
  background: var(--bg-surface);
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 18px;
}
.help-dont-show {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  cursor: pointer;
}
.help-dont-show input[type="checkbox"] {
  accent-color: var(--accent-500);
  cursor: pointer;
}
.help-footer-actions {
  display: flex;
  gap: 0.75rem;
}
.btn-help-nav {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--ease-fast);
}
.btn-help-nav:hover {
  background: var(--bg-panel);
  border-color: var(--border-accent);
}
.btn-help-done {
  background: var(--accent-500);
  border: 1px solid var(--accent-400);
  color: #000;
  padding: 0.4rem 1.25rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  transition: all var(--ease-fast);
}
.btn-help-done:hover {
  background: var(--accent-400);
  transform: translateY(-1px);
}
`;

css = css.replace("/* Mobile responsive drawer */", helpCSS + "\n/* Mobile responsive drawer */");
fs.writeFileSync('src/style.css', css);
