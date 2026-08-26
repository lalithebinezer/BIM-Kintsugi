const fs = require('fs');
let fileStr = fs.readFileSync('src/main.ts', 'utf-8');

// The loading overlay is getting stuck. Usually this is because byIfcBuildingStorey throws if it's missing Storeys (like in a raw generic proxy load).
// We should wrap ALL classifier calls in try/catch to prevent blocking the UI.
fileStr = fileStr.replace(
  /await classifier\.byIfcBuildingStorey\(\{ classificationName: "Storeys" \}\);/g,
  `try { await classifier.byIfcBuildingStorey({ classificationName: "Storeys" }); } catch(e) { console.warn("Storeys class error:", e); }`
);

fileStr = fileStr.replace(
  /await classifier\.byCategory\(\{ classificationName: "Categories" \}\);/g,
  `try { await classifier.byCategory({ classificationName: "Categories" }); } catch(e) { console.warn("Categories class error:", e); }`
);

// We should also make sure updateClassificationUI is wrapped in try/catch
fileStr = fileStr.replace(
  /await updateClassificationUI\(\);/g,
  `try { await updateClassificationUI(); } catch(e) { console.warn("updateClassificationUI error:", e); }`
);

fs.writeFileSync('src/main.ts', fileStr);
console.log('Fixed loading blocks');
