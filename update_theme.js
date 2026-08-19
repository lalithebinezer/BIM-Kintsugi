const fs = require('fs');

let css = fs.readFileSync('src/style.css', 'utf-8');

// Replace the :root block
const newRoot = `:root {
  --font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Industrial Light Tokens */
  --bg-app: #e2e8f0;
  --bg-panel: rgba(255, 255, 255, 0.95);
  --bg-panel-header: rgba(248, 250, 252, 0.95);
  --bg-card: #f1f5f9;
  --bg-input: #f8fafc;
  --bg-overlay: rgba(255, 255, 255, 0.85);
  --bg-surface: #ffffff;

  --border-strong: rgba(15, 23, 42, 0.15);
  --border-subtle: rgba(15, 23, 42, 0.05);
  --border-color: rgba(15, 23, 42, 0.08);
  --border-hover: rgba(15, 23, 42, 0.25);
  --border-accent: #2563eb;
  --border-accent-hi: #3b82f6;

  --accent-100: #dbeafe;
  --accent-200: #bfdbfe;
  --accent-300: #93c5fd;
  --accent-400: #60a5fa;
  --accent-500: #2563eb;
  --accent-600: #1d4ed8;
  --accent-btn-text: #ffffff;
  --accent-glow: rgba(37, 99, 235, 0.2);
  --accent-glow2: rgba(37, 99, 235, 0.1);

  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  --text-primary: #0f172a;
  --text-main: #334155;
  --text-muted: #64748b;
  --text-dim: #94a3b8;
  --text-dark: #000000;

  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(15, 23, 42, 0.1);
  --glass-blur: 24px;
  --glass-shine: inset 0 1px 0 rgba(255, 255, 255, 0.5);

  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.05);
  --shadow-sm: 0 2px 4px rgba(15, 23, 42, 0.05), 0 0 1px rgba(15, 23, 42, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.05), 0 0 1px rgba(15, 23, 42, 0.1);
  --shadow-panel: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.01), 0 0 1px rgba(15, 23, 42, 0.15);
  --shadow-float: 0 20px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.01), 0 0 1px rgba(15, 23, 42, 0.2);
  --shadow-glow: 0 0 12px rgba(37, 99, 235, 0.2);
  
  --ease-fast: 0.12s cubic-bezier(0.4, 0, 0.2, 1);
  --ease-normal: 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-slow: 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  --theme-transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}`;

css = css.replace(/:root\s*\{[\s\S]*?--theme-transition:[\s\S]*?\}/, newRoot);

// Restore gaps and paddings
css = css.replace(/\.ui-layer \{\s*position: absolute;\s*inset: 0;\s*z-index: 10;\s*pointer-events: none;\s*display: grid;\s*grid-template-columns: 340px 1fr 370px;\s*grid-template-rows: 58px 1fr 34px;\s*padding: 0;\s*gap: 0;\s*\}/, 
`.ui-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  display: grid;
  grid-template-columns: 340px 1fr 370px;
  grid-template-rows: 58px 1fr 34px;
  padding: 0.75rem;
  gap: 0.75rem;
}`);

css = css.replace(/header \{\n  grid-column: 1 \/ 4;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  background: var\(--bg-panel\);\n  backdrop-filter: blur\(var\(--glass-blur\)\) saturate\(190%\);\n  -webkit-backdrop-filter: blur\(var\(--glass-blur\)\) saturate\(190%\);\n  border: 1px solid var\(--border-color\);\n  border-radius: 0;\n  padding: 0 1\.1rem;/g,
`header {
  grid-column: 1 / 4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0 1.1rem;`);

css = css.replace(/\.panel \{\n  background: var\(--bg-panel\);\n  backdrop-filter: blur\(var\(--glass-blur\)\) saturate\(190%\);\n  -webkit-backdrop-filter: blur\(var\(--glass-blur\)\) saturate\(190%\);\n  border: 1px solid var\(--border-color\);\n  border-radius: 0;/g,
`.panel {
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  border: 1px solid var(--border-color);
  border-radius: 12px;`);

css = css.replace(/border-radius: 0 !important;/g, '');
css = css.replace(/border-top: none;/g, '');
css = css.replace(/border-bottom: none;/g, '');
css = css.replace(/border-left: none;/g, '');
css = css.replace(/border-right: none;/g, '');

fs.writeFileSync('src/style.css', css);
