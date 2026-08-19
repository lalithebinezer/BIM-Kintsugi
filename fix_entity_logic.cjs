const fs = require('fs');
let fileStr = fs.readFileSync('src/main.ts', 'utf-8');

fileStr = fileStr.replace(
  /if \(entityName === "IFCBUILDINGELEMENT" \|\| entityName === "IFCBUILDINGELEMENTPROXY" \|\| !entityName\) \{/g,
  'if (entityName.includes("IFCBUILDINGELEMENT") || entityName === "IFCPROXY" || entityName === "IFCELEMENT" || !entityName) {'
);

fs.writeFileSync('src/main.ts', fileStr);
console.log('Fixed generic entity logic');
