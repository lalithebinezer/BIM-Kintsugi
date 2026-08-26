const fs = require('fs');

let css = fs.readFileSync('src/style.css', 'utf-8');

// Remove outdated media queries for .ui-layer grid template and header/hud anchors
const startIdx = css.indexOf('@media (max-width: 1024px) {');
if (startIdx !== -1) {
    const endIdx = css.indexOf('/* Mobile responsive drawer */', startIdx);
    if (endIdx !== -1) {
        // Just remove the block that messes with grids
        const badBlockRegex = /@media \(max-width: 1024px\) \{[\s\S]*?\.left-sidebar, \.right-sidebar/m;
        css = css.replace(badBlockRegex, '@media (max-width: 1024px) {\n\n  .left-sidebar, .right-sidebar');
    }
}

// Remove old left-sidebar-collapsed ui-layer logic
css = css.replace(/body\.left-sidebar-collapsed \.ui-layer \{[\s\S]*?\}/g, '');
css = css.replace(/body\.right-sidebar-collapsed \.ui-layer \{[\s\S]*?\}/g, '');
css = css.replace(/body\.left-sidebar-collapsed\.right-sidebar-collapsed \.ui-layer \{[\s\S]*?\}/g, '');


fs.writeFileSync('src/style.css', css);
