const fs = require('fs');

let appTsx = fs.readFileSync('src/renderer/App.tsx', 'utf8');

// Inside initApp, right after setHistory(loadedHistory)
appTsx = appTsx.replace(
  /setHistory\(loadedHistory\);/g,
  `setHistory(loadedHistory);\n          console.log("[DEBUG RENDERER] Loaded history:", loadedHistory);\n          console.log("[DEBUG RENDERER] Calling addHistory manually");\n          try {\n            const testRec = await window.calculoAPI.addHistory({ expression: "25 * 4", result: "100", angleMode: "deg" });\n            console.log("[DEBUG RENDERER] addHistory returned:", testRec);\n          } catch (e) {\n            console.error("[DEBUG RENDERER] addHistory failed:", e);\n          }`
);

fs.writeFileSync('src/renderer/App.tsx', appTsx);
console.log("Injected test");
