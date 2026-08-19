const fs = require('fs');

let css = fs.readFileSync('src/style.css', 'utf-8');

// Update imports
css = css.replace(
  "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');",
  "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;500;800&family=Syne:wght@800&family=JetBrains+Mono:wght@400;700&display=swap');"
);

// Update root vars
const rootRegex = /:root\s*\{[\s\S]*?\}/;
const newRoot = `:root {
  --font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Syne', sans-serif;
  --font-mono: 'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Obsidian Dark Pro Tokens */
  --bg-app: #0A0A0C;
  --bg-panel: rgba(20, 20, 24, 0.8);
  --bg-panel-header: rgba(20, 20, 24, 0.95);
  --bg-card: #141418;
  --bg-input: rgba(255,255,255,0.05);
  --bg-overlay: rgba(10, 10, 12, 0.85);
  --bg-surface: #141418;

  --border-strong: rgba(255, 255, 255, 0.15);
  --border-subtle: rgba(255, 255, 255, 0.05);
  --border-color: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.25);
  --border-accent: #D4FF3F;
  --border-accent-hi: #e5ff7a;

  --accent-100: #e5ff7a;
  --accent-200: #e5ff7a;
  --accent-300: #e5ff7a;
  --accent-400: #D4FF3F;
  --accent-500: #D4FF3F;
  --accent-600: #c1e638;
  --accent-btn-text: #000000;
  
  --accent-glow: rgba(212, 255, 63, 0.2);
  --accent-glow2: rgba(212, 255, 63, 0.1);

  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  --text-primary: #ffffff;
  --text-main: #E4E4E7;
  --text-muted: #71717A;
  --text-dim: #52525b;
  --text-dark: #000000;

  --glass-bg: rgba(20, 20, 24, 0.85);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 24px;
  --glass-shine: inset 0 1px 0 rgba(255, 255, 255, 0.1);

  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 0, 0, 0.8);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 0, 0, 0.8);
  --shadow-panel: 0 20px 40px rgba(0,0,0,0.4);
  --shadow-float: 0 20px 40px rgba(0,0,0,0.4);
  --shadow-glow: 0 0 12px rgba(212, 255, 63, 0.2);
  
  --ease-fast: 0.12s cubic-bezier(0.4, 0, 0.2, 1);
  --ease-normal: 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-slow: 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  --theme-transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}`;

css = css.replace(rootRegex, newRoot);
fs.writeFileSync('src/style.css', css);
console.log('Done updating CSS variables');
