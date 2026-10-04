const fs = require('fs');

let appTsx = fs.readFileSync('src/renderer/App.tsx', 'utf8');
appTsx = appTsx.replace(
  /const handleCalculate = async \(expr: string = expression\) => \{([\s\S]*?)const res = engine\.evaluate\(expr\);/g,
  `const handleCalculate = async (expr: string = expression) => {\n    console.log("[DEBUG] handleCalculate called with:", expr);\n$1const res = engine.evaluate(expr);`
);
appTsx = appTsx.replace(
  /if \(res\.success && res\.value\) \{([\s\S]*?)await saveToHistory\(expr, res\.value\);/g,
  `if (res.success && res.value) {\n      console.log("[DEBUG] evaluation success, calling saveToHistory", expr, res.value);\n$1await saveToHistory(expr, res.value);`
);
appTsx = appTsx.replace(
  /const saveToHistory = async \(expr: string, resValue: string\) => \{([\s\S]*?)const newRecord = await window\.calculoAPI\.addHistory/g,
  `const saveToHistory = async (expr: string, resValue: string) => {\n    console.log("[DEBUG] saveToHistory called", expr, resValue);\n$1const newRecord = await window.calculoAPI.addHistory`
);
appTsx = appTsx.replace(
  /setHistory\(prev => \[newRecord, \.\.\.prev\]\.slice\(0, 100\)\);/g,
  `console.log("[DEBUG] newRecord received:", newRecord);\n      setHistory(prev => [newRecord, ...prev].slice(0, 100));`
);
fs.writeFileSync('src/renderer/App.tsx', appTsx);

let mainTs = fs.readFileSync('src/main/main.ts', 'utf8');
mainTs = mainTs.replace(
  /ipcMain\.handle\('add-history', \(_, record.*?\) => store\.addHistory\(record\)\);/g,
  `ipcMain.handle('add-history', (_, record: Omit<CalculationRecord, 'id'|'timestamp'>) => {\n  console.log('[DEBUG MAIN] add-history IPC received', record);\n  return store.addHistory(record);\n});`
);
fs.writeFileSync('src/main/main.ts', mainTs);

let storeTs = fs.readFileSync('src/main/store.ts', 'utf8');
storeTs = storeTs.replace(
  /addHistory\(record: Omit<CalculationRecord, 'id' \| 'timestamp'>\): CalculationRecord \{/g,
  `addHistory(record: Omit<CalculationRecord, 'id' | 'timestamp'>): CalculationRecord {\n    console.log('[DEBUG STORE] addHistory called', record);`
);
storeTs = storeTs.replace(
  /this\.saveData\(\);/g,
  `console.log('[DEBUG STORE] calling saveData');\n    this.saveData();`
);
fs.writeFileSync('src/main/store.ts', storeTs);

console.log("Injected debug logging");
