const fs = require('fs');

let css = fs.readFileSync('src/style.css', 'utf-8');

const missingUI = `
/* ============================================================
   WIDGETS & PANELS
   ============================================================ */
.items-finder-widget,
.measurements-widget,
.gaming-settings-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.model-data-query-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.query-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.settings-cat-panel,
.tools-cat-panel {
  display: none;
}
.settings-cat-panel.active,
.tools-cat-panel.active {
  display: block;
}

.preset-options-subpanel {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 0.5rem;
  margin-top: 0.5rem;
}

.setting-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-subtle);
}

.saved-views-ribbon-wrapper {
  position: relative;
}

.scene-tree {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.8rem;
}
.tree-search {
  width: 100%;
  padding: 0.4rem 0.5rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  font-family: var(--font-body);
  font-size: 0.75rem;
}

/* ============================================================
   BUTTONS & INPUTS
   ============================================================ */
.btn-export-prompt,
.btn-query-execute,
.btn-timeline-csv {
  background: var(--accent-500);
  color: #000;
  border: 1px solid var(--accent-400);
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--ease-fast);
}
.btn-export-prompt:hover,
.btn-query-execute:hover,
.btn-timeline-csv:hover {
  background: var(--accent-400);
}

.btn-filter-chip {
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  border-radius: 20px;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all var(--ease-fast);
}
.btn-filter-chip:hover {
  background: var(--bg-panel);
  color: var(--text-primary);
  border-color: var(--border-strong);
}
.btn-filter-chip.active {
  background: var(--accent-glow);
  border-color: var(--accent-400);
  color: var(--accent-500);
}

.btn-hint-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.btn-pin-cat {
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  cursor: pointer;
  color: var(--text-muted);
}
.btn-pin-cat.active {
  background: var(--accent-glow);
  color: var(--accent-500);
  border-color: var(--accent-400);
}

.btn-quick-highlight-preset {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  font-size: 0.7rem;
  cursor: pointer;
  color: var(--text-primary);
  flex: 1;
  text-align: center;
}
.btn-quick-highlight-preset:hover {
  background: var(--bg-panel);
}

.custom-select {
  width: 100%;
  padding: 0.35rem 0.5rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.75rem;
}

.interactive-gold {
  color: #fbbf24 !important;
  border-color: #fbbf24 !important;
}
.interactive-gold:hover {
  background: rgba(251, 191, 36, 0.1) !important;
}

/* ============================================================
   EMPTY STATES
   ============================================================ */
.empty-state, .empty-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1rem;
  height: 100%;
  color: var(--text-muted);
}
.empty-state-card {
  background: var(--bg-card);
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-muted);
}
.empty-card-icon {
  opacity: 0.5;
  margin-bottom: 0.75rem;
}
.empty-state-text {
  font-size: 0.8rem;
  line-height: 1.4;
}

/* ============================================================
   KEY BINDINGS
   ============================================================ */
.key-bindings-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.key-bind-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
}
.key-bind-btn {
  font-family: var(--font-mono);
  background: var(--bg-input);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  cursor: pointer;
}
.ctrl-icon {
  opacity: 0.7;
}

/* ============================================================
   TIMELINE
   ============================================================ */
.timeline-legend {
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
  background: var(--bg-card);
  border-radius: 4px;
  font-size: 0.7rem;
  color: var(--text-muted);
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
}
.legend-color-picker {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border: none;
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
}
.legend-color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}
.legend-color-picker::-webkit-color-swatch {
  border: 1px solid var(--border-strong);
  border-radius: 50%;
}

.timeline-speed-select {
  padding: 0.15rem 0.35rem;
  font-size: 0.7rem;
  border-radius: 3px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.timeline-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.ticker-hint {
  position: absolute;
  top: -24px;
  background: var(--accent-500);
  color: #000;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 800;
  font-family: var(--font-mono);
  white-space: nowrap;
  transform: translateX(-50%);
}

/* ============================================================
   MISC UTILS
   ============================================================ */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 40;
  display: none;
  backdrop-filter: blur(2px);
}
.sidebar-backdrop.active {
  display: block;
}

.pill-value {
  display: inline-block;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  padding: 0.1rem 0.4rem;
  border-radius: 20px;
  font-family: var(--font-mono);
  font-size: 0.65rem;
}

.step-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.total-cost-card {
  transition: transform var(--ease-fast);
}
.total-cost-card:hover {
  transform: translateY(-2px);
}

.font-bold { font-weight: 700; }
.font-mono { font-family: var(--font-mono); }
.font-purple, .color-purple { color: #8b5cf6; }
.color-cyan { color: #06b6d4; }
.color-green { color: #10b981; }
`;

css = css.replace("/* Mobile responsive drawer */", missingUI + "\n/* Mobile responsive drawer */");
fs.writeFileSync('src/style.css', css);
