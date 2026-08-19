const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf-8');

css = css.replace(
  /html, body \{[\s\S]*?\}/,
  `html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(circle at center, #1c1c21, #000);
  font-family: var(--font-body);
  color: var(--text-main);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-size: 14px;
  line-height: 1.5;
  transition: var(--theme-transition);
}`
);

fs.writeFileSync('src/style.css', css);
console.log('Background updated');
