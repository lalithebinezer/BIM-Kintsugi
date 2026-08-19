const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const btnMatch = html.match(/<button class="btn-shortcuts-toggle" id="btn-shortcuts-toggle"[\s\S]*?<\/button>/);
if (btnMatch) {
    const btnHtml = btnMatch[0].replace('class="btn-shortcuts-toggle"', 'class="btn-quick-view" style="color: var(--accent-500); border-color: var(--accent-500);"');
    
    // Remove it from header
    html = html.replace(btnMatch[0], '');
    
    // Append it to quick-view-toolbar
    html = html.replace(/<button class="btn-quick-view" id="btn-view-snapshot"[\s\S]*?<\/button>\s*<\/div>/, match => {
        return match.replace('</div>', `  ${btnHtml}\n        </div>`);
    });
    
    fs.writeFileSync('index.html', html);
}
