const fs = require('fs');

let ts = fs.readFileSync('src/ui/UIManager.ts', 'utf-8');

// Add logic to show right sidebar when an element is selected
if (!ts.includes("bimKintsugiCore.onElementSelected =")) {
    const hook = `
  // Automatically manage contextual right sidebar based on selection state
  public hookSelectionContext() {
    // If the core exposes an event or we can just listen to the highlighter
    // For now, we will add a global function that the main.ts can call
    window.showContextualProperties = (show) => {
      if(show) {
         document.body.classList.remove('right-sidebar-collapsed');
      } else {
         document.body.classList.add('right-sidebar-collapsed');
      }
    }
  }
`;
    // We will just patch main.ts instead to handle this natively
}

