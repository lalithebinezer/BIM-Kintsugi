const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf-8');
index = index.replace(/<body[^>]*>/, '<body class="left-sidebar-collapsed right-sidebar-collapsed">');
fs.writeFileSync('index.html', index);

let ui = fs.readFileSync('src/ui/UIManager.ts', 'utf-8');
ui = ui.replace(/document\.body\.classList\.toggle\('left-sidebar-collapsed'\);/g, 
`document.body.classList.toggle('left-sidebar-collapsed');
        if (!document.body.classList.contains('left-sidebar-collapsed')) {
          document.body.classList.add('right-sidebar-collapsed');
        }`);
ui = ui.replace(/document\.body\.classList\.toggle\('right-sidebar-collapsed'\);/g, 
`document.body.classList.toggle('right-sidebar-collapsed');
        if (!document.body.classList.contains('right-sidebar-collapsed')) {
          document.body.classList.add('left-sidebar-collapsed');
        }`);
fs.writeFileSync('src/ui/UIManager.ts', ui);

