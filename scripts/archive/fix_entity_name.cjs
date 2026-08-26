const fs = require('fs');
let fileStr = fs.readFileSync('src/main.ts', 'utf-8');

// We can import WEBIFC at the top if it's not already there, or just use the global WEBIFC if it exists.
// Actually, let's just add the import at the top.
if (!fileStr.includes('import * as WEBIFC from "web-ifc";')) {
  fileStr = fileStr.replace(
    'import * as OBC from "@thatopen/components";',
    'import * as OBC from "@thatopen/components";\nimport * as WEBIFC from "web-ifc";'
  );
}

// Then rewrite getIfcEntityName
fileStr = fileStr.replace(
  /\/\/ Convert IFC type code \(integer\) to readable entity name[\s\S]*?function getIfcEntityName[\s\S]*?return String\(type\);\n\}/,
  `// Convert IFC type code (integer) to readable entity name
let ifcReverseMap: Record<number, string> | null = null;
function getIfcEntityName(type: any): string {
  if (type === undefined || type === null) return "";
  if (typeof type === "number") {
    if (!ifcReverseMap) {
      ifcReverseMap = {};
      for (const key in WEBIFC) {
        if (key.startsWith("IFC") && typeof (WEBIFC as any)[key] === "number") {
          ifcReverseMap[(WEBIFC as any)[key]] = key;
        }
      }
    }
    if (ifcReverseMap[type]) {
      return ifcReverseMap[type];
    }
    
    // Fallback if webIfc api is available (it might be under ifcLoader.webIfc)
    try {
      if (ifcLoader && (ifcLoader as any).webIfc) {
        const name = (ifcLoader as any).webIfc.GetNameFromTypeCode(type);
        if (name) return name;
      }
    } catch (e) {
      // fallback
    }
  }
  return String(type);
}`
);

fs.writeFileSync('src/main.ts', fileStr);
console.log('Fixed getIfcEntityName');
