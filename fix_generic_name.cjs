const fs = require('fs');

let fileStr = fs.readFileSync('src/main.ts', 'utf-8');

// I will improve the entityName fallback chain
fileStr = fileStr.replace(
  /\} else if \(elementProps\.ObjectType\) \{[\s\S]*?entityName = "IFC_BUILDING_COMPONENT";\n      \}\n    \}\n  \}/,
  `} else if (elementProps.ObjectType) {
      const objTypeStr = getPropValue(elementProps.ObjectType).toUpperCase().replace(/\\s+/g, "_");
      entityName = objTypeStr.startsWith("IFC") ? objTypeStr : \`IFC_\${objTypeStr}\`;
    } else {
      // 4. Try to find a Family or Category from property sets
      let foundSpecificType = false;
      for (const psetName in psets) {
        if (psets[psetName]["Family"]) {
          entityName = String(psets[psetName]["Family"]).toUpperCase().replace(/\\s+/g, "_");
          foundSpecificType = true;
          break;
        } else if (psets[psetName]["Category"]) {
          entityName = String(psets[psetName]["Category"]).toUpperCase().replace(/\\s+/g, "_");
          foundSpecificType = true;
          break;
        } else if (psets[psetName]["Reference"]) {
          entityName = String(psets[psetName]["Reference"]).toUpperCase().replace(/\\s+/g, "_");
          foundSpecificType = true;
          break;
        }
      }
      
      if (!foundSpecificType) {
        if (elementProps.Name) {
           const nameStr = getPropValue(elementProps.Name);
           // Simple heuristic: if name has a colon (like Family:Type), grab it
           if (nameStr && nameStr.includes(":")) {
             entityName = nameStr.split(":")[0].toUpperCase().replace(/\\s+/g, "_");
           } else if (elementProps.Tag) {
             entityName = \`IFC_ELEMENT_TAG_\${elementProps.Tag}\`;
           } else {
             entityName = "IFC_BUILDING_COMPONENT";
           }
        } else if (elementProps.Tag) {
          entityName = \`IFC_ELEMENT_TAG_\${elementProps.Tag}\`;
        } else {
          entityName = "IFC_BUILDING_COMPONENT";
        }
      }
    }
  }`
);

fs.writeFileSync('src/main.ts', fileStr);
console.log('Fixed generic name resolution');
