const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /\.sidebar \{[\s\S]*?\}/,
  `.sidebar {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  overflow: hidden;
  z-index: 15;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border-color);
  border-radius: 24px;
  box-shadow: var(--shadow-panel);
}`
);

css = css.replace(
  /\.sidebar-tab-bar \{[\s\S]*?\}/,
  `.sidebar-tab-bar {
  display: flex;
  gap: 0.35rem;
  padding: 1rem 1rem 0.5rem 1rem;
  flex-shrink: 0;
  background: transparent;
}`
);

css = css.replace(
  /\.sidebar-tab-btn \{[\s\S]*?\}/,
  `.sidebar-tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 10px 0;
  min-width: 0;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--ease-fast);
  white-space: nowrap;
}`
);

css = css.replace(
  /\.sidebar-tab-btn\.active \{[\s\S]*?\}/,
  `.sidebar-tab-btn.active {
  background: rgba(255,255,255,0.05) !important;
  color: var(--accent-500) !important;
  border-color: transparent !important;
  box-shadow: none;
}`
);

css = css.replace(
  /\.panel \{[\s\S]*?\}/,
  `.panel {
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  height: 100%;
}`
);

// We need to keep some border/background for panel-header
css = css.replace(
  /\.panel-header \{[\s\S]*?\}/,
  `.panel-header {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  flex-shrink: 0;
  user-select: none;
  background: transparent;
  border-bottom: 1px solid var(--border-color);
}`
);

fs.writeFileSync('src/style.css', css);
console.log('Sidebar CSS updated');
