const fs = require('fs');

const css = `
.bim-search-guide-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  text-align: center;
  gap: 1.5rem;
}

.guide-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  width: 100%;
}

.guide-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 1rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  text-align: left;
}

.guide-icon {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.guide-card-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.guide-card-text {
  font-size: 0.68rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.guide-card-text code {
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 3px;
  padding: 0.1rem 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--accent-400);
}

.guide-footer-status {
  margin-top: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-dim);
  background: var(--bg-surface);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid var(--border-subtle);
}

.recent-empty {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
  padding: 0.5rem 0;
}

.recent-term-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: none;
  padding: 0.35rem 0.5rem;
  font-size: 0.7rem;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 6px;
  transition: all var(--ease-fast);
  text-align: left;
}

.recent-term-chip:hover {
  background: var(--bg-card);
  color: var(--accent-400);
}

.recent-term-chip svg {
  color: var(--text-dim);
}
`;

fs.appendFileSync('src/style.css', css);
console.log('Appended missing guide CSS');
