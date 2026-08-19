const webifc = require('web-ifc');
console.log(Object.keys(webifc).filter(k => k.includes('Category') || k.includes('Type') || k.includes('IFC')));
