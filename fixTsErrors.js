const fs = require('fs');

// Fix AdvancedWorkspace
let aw = fs.readFileSync('src/renderer/components/AdvancedWorkspace.tsx', 'utf8');

// I might have declared onSaveHistory but replaced the execution block incorrectly in some tools if it didn't match.
aw = aw.replace(/const ComplexTool = \(\{ angleMode, onSaveHistory \}: \{ angleMode: AngleMode, onSaveHistory\?: \(e: string, r: string\) => void \}\) => \{/g, `const ComplexTool = ({ angleMode, onSaveHistory }: { angleMode: AngleMode, onSaveHistory?: (e: string, r: string) => void }) => {`);
// In executeMulti of ComplexTool:
aw = aw.replace(/if \(res\.success\) setResult\(res\.value!\);\s*else setResult\("Error: " \+ res\.error\);/g, `if (res.success) {\n      setResult(res.value!);\n      onSaveHistory?.('Complex operation', res.value!);\n    } else setResult("Error: " + res.error);`);
// In executeSingle of ComplexTool:
aw = aw.replace(/if \(res\.success\) setResult\(res\.value!\);\s*else setResult\("Error: " \+ res\.error\);/g, `if (res.success) {\n      setResult(res.value!);\n      onSaveHistory?.('Complex operation', res.value!);\n    } else setResult("Error: " + res.error);`);

// In executeMulti of VectorTool:
aw = aw.replace(/if \(res\.success\) setResult\(typeof res\.value === 'number' \? res\.value\.toString\(\) : JSON\.stringify\(res\.value\)\);\s*else setResult\("Error: " \+ res\.error\);/g, `if (res.success) {\n      const resStr = typeof res.value === 'number' ? res.value.toString() : JSON.stringify(res.value);\n      setResult(resStr);\n      onSaveHistory?.('Vector operation', resStr);\n    } else setResult("Error: " + res.error);`);
// In executeSingle of VectorTool:
aw = aw.replace(/if \(res\.success\) setResult\(typeof res\.value === 'number' \? res\.value\.toString\(\) : JSON\.stringify\(res\.value\)\);\s*else setResult\("Error: " \+ res\.error\);/g, `if (res.success) {\n      const resStr = typeof res.value === 'number' ? res.value.toString() : JSON.stringify(res.value);\n      setResult(resStr);\n      onSaveHistory?.('Vector operation', resStr);\n    } else setResult("Error: " + res.error);`);

// In SolverTool:
aw = aw.replace(/if \(res\.success\) \{\s*setResult\(JSON\.stringify\(res\.value, null, 2\)\);\s*\} else \{\s*setResult\("Error: " \+ res\.error\);\s*\}/g, `if (res.success) {\n      const resStr = JSON.stringify(res.value, null, 2);\n      setResult(resStr);\n      onSaveHistory?.('Solve equations', resStr);\n    } else {\n      setResult("Error: " + res.error);\n    }`);

fs.writeFileSync('src/renderer/components/AdvancedWorkspace.tsx', aw);

// Fix GraphingWorkspace
let gw = fs.readFileSync('src/renderer/components/GraphingWorkspace.tsx', 'utf8');

gw = gw.replace(/onSaveHistory\?\.\('Evaluate graph at x=' \+ val, results\.join\(', '\)\);/g, `onSaveHistory?.('Evaluate graph at x=' + xVal, results.join(', '));`);

// Change React.PointerEvent<SVGSVGElement> to React.PointerEvent<HTMLDivElement>
gw = gw.replace(/React\.PointerEvent<SVGSVGElement>/g, `React.PointerEvent<HTMLDivElement>`);

fs.writeFileSync('src/renderer/components/GraphingWorkspace.tsx', gw);

console.log('TS errors fixed');
