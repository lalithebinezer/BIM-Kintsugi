const webifc = require('web-ifc');
const reverseMap = {};
for (const key in webifc) {
  if (key.startsWith('IFC') && typeof webifc[key] === 'number') {
    reverseMap[webifc[key]] = key;
  }
}
console.log('Mapping for 3131343751 (just testing some int):', reverseMap[3131343751] || 'Not found');
console.log('Total mapped:', Object.keys(reverseMap).length);
