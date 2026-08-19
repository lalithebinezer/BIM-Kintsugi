const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /\.brand-logo \{[\s\S]*?\}/,
  `.brand-logo {
  width: 42px;
  height: 42px;
  border: 2px solid var(--accent-500);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(45deg);
  border-radius: 0;
  box-shadow: none;
  flex-shrink: 0;
  transition: all 0.2s;
}`
);

css = css.replace(
  /\.brand-logo svg \{[\s\S]*?\}/,
  `.brand-logo div {
  transform: rotate(-45deg);
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--accent-500);
  font-size: 1.25rem;
}`
);

css = css.replace(
  /\.brand-text h1 \{[\s\S]*?\}/,
  `.brand-text h1 {
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: -0.04em;
  text-transform: uppercase;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  margin: 0;
}`
);

css = css.replace(
  /\.brand-badge \{[\s\S]*?\}/,
  `.brand-badge {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  background: var(--accent-500);
  color: black;
  padding: 2px 8px;
  border-radius: 99px;
  margin-left: 0.5rem;
  font-weight: 800;
  border: none;
}`
);

fs.writeFileSync('src/style.css', css);
console.log('Logo CSS updated');
