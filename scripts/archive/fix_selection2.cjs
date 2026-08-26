const fs = require('fs');
let ts = fs.readFileSync('src/main.ts', 'utf-8');

// Replace selection logic to automatically open right sidebar and close left sidebar for focus
ts = ts.replace(
    /displayElementProperties\(selectedModel, firstExpressId\);\n\s*return;/g, 
    `displayElementProperties(selectedModel, firstExpressId);
          // Show properties panel automatically, hide project tree if open
          document.body.classList.remove('right-sidebar-collapsed');
          document.body.classList.add('left-sidebar-collapsed');
          return;`
);

ts = ts.replace(
    /resetPropertiesPanel\(\);\n\s*\}\);/g, 
    `resetPropertiesPanel();
      // Auto-hide properties panel when selection clears
      document.body.classList.add('right-sidebar-collapsed');
    });`
);

fs.writeFileSync('src/main.ts', ts);
