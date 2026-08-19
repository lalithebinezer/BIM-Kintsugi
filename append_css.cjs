const fs = require('fs');

const css = `
.bim-search-tools-section {
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem;
  gap: 0.8rem;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-color);
}

.bim-search-controls-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.bim-search-select-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.search-control-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-dim);
}

.btn-search-refresh-index {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--ease-fast);
}

.btn-search-refresh-index:hover {
  background: var(--bg-surface);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.bim-search-categories-bar {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.bim-search-presets-bar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.search-preset-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-dim);
}

.search-preset-chip {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 0.2rem 0.4rem;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--ease-fast);
}

.search-preset-chip:hover {
  background: var(--bg-surface);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.bim-search-batch-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: var(--bg-panel-header);
  border-bottom: 1px solid var(--border-color);
  gap: 1rem;
}

.batch-summary-info {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.batch-action-buttons {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-search-batch {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.35rem 0.6rem;
  color: var(--text-primary);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--ease-fast);
}

.btn-search-batch:hover {
  background: var(--bg-surface);
  border-color: var(--border-strong);
}

.bim-search-recent-section {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.btn-clear-recent {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
}

.btn-clear-recent:hover {
  background: var(--bg-surface);
  color: var(--text-primary);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.bim-search-results-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.85rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 200px;
}

.bim-search-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: var(--bg-panel-header);
  border-top: 1px solid var(--border-color);
}

.search-shortcuts-guide {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.7rem;
  color: var(--text-dim);
}

.search-shortcuts-guide kbd {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 3px;
  padding: 0.1rem 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--text-muted);
}

.search-index-status {
  font-size: 0.7rem;
  color: var(--text-dim);
}

.btn-search-clear {
  background: transparent;
  border: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.btn-search-clear:hover {
  color: var(--text-primary);
}
`;

fs.appendFileSync('src/style.css', css);
console.log('Appended missing search modal CSS');
