const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /\.model-stats-hud \{[\s\S]*?\}/,
  `.model-stats-hud {
  position: absolute;
  bottom: 2rem;
  left: calc(320px + 2rem);
  z-index: 60;
  transition: left var(--ease-normal);
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: none;
}`
);

// We need to target the spans inside stats-hud-row.
// Originally it has .stats-hud-row, .stats-hud-label, .stats-hud-value.
css = css.replace(
  /\.stats-hud-label \{[\s\S]*?\}/,
  `.stats-hud-label {
  color: var(--text-muted);
  text-transform: uppercase;
}`
);

css = css.replace(
  /\.stats-hud-value \{[\s\S]*?\}/,
  `.stats-hud-value {
  color: var(--accent-500);
  font-weight: 800;
}`
);

fs.writeFileSync('src/style.css', css);
console.log('Telemetry updated');
