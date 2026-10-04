const fs = require('fs');

let aw = fs.readFileSync('src/renderer/components/AdvancedWorkspace.tsx', 'utf8');

// MatrixTool
aw = aw.replace(
  /if \(res.success\) setResult\(JSON.stringify\(res.value\)\);\s*else setResult\("Error: " \+ res.error\);/g,
  `if (res.success) {
      const resStr = JSON.stringify(res.value);
      setResult(resStr);
      onSaveHistory?.('Matrix operation', resStr);
    } else setResult("Error: " + res.error);`
);
aw = aw.replace(/const ComplexTool = \(\{ angleMode \}: \{ angleMode: AngleMode \}\) => \{/g, `const ComplexTool = ({ angleMode, onSaveHistory }: { angleMode: AngleMode, onSaveHistory?: (e: string, r: string) => void }) => {`);
aw = aw.replace(
  /if \(res.success\) setResult\(res.value!\);\s*else setResult\("Error: " \+ res.error\);/g,
  `if (res.success) {
      setResult(res.value!);
      onSaveHistory?.('Complex operation', res.value!);
    } else setResult("Error: " + res.error);`
);

aw = aw.replace(/const VectorTool = \(\) => \{/g, `const VectorTool = ({ onSaveHistory }: { onSaveHistory?: (e: string, r: string) => void }) => {`);
aw = aw.replace(
  /if \(res.success\) setResult\(typeof res.value === 'number' \? res.value.toString\(\) : JSON.stringify\(res.value\)\);\s*else setResult\("Error: " \+ res.error\);/g,
  `if (res.success) {
      const resStr = typeof res.value === 'number' ? res.value.toString() : JSON.stringify(res.value);
      setResult(resStr);
      onSaveHistory?.('Vector operation', resStr);
    } else setResult("Error: " + res.error);`
);

aw = aw.replace(/const SolverTool = \(\) => \{/g, `const SolverTool = ({ onSaveHistory }: { onSaveHistory?: (e: string, r: string) => void }) => {`);
aw = aw.replace(
  /if \(res.success\) \{\s*setResult\(JSON.stringify\(res.value, null, 2\)\);\s*\} else \{\s*setResult\("Error: " \+ res.error\);\s*\}/g,
  `if (res.success) {
      const resStr = JSON.stringify(res.value, null, 2);
      setResult(resStr);
      onSaveHistory?.('Solve equations', resStr);
    } else {
      setResult("Error: " + res.error);
    }`
);

fs.writeFileSync('src/renderer/components/AdvancedWorkspace.tsx', aw);
console.log('AdvancedWorkspace updated');

let gw = fs.readFileSync('src/renderer/components/GraphingWorkspace.tsx', 'utf8');
if (!gw.includes('onSaveHistory')) {
  gw = gw.replace(/export const GraphingWorkspace: React.FC<Props> = \(\{ angleMode \}\) => \{/, 
  `interface GWProps extends Props { onSaveHistory?: (e: string, r: string) => void; }
export const GraphingWorkspace: React.FC<GWProps> = ({ angleMode, onSaveHistory }) => {`);
  gw = gw.replace(/setEvalResults\(results\);/, `setEvalResults(results);
    if (results.length > 0 && !results[0].includes('Error')) {
      onSaveHistory?.('Evaluate graph at x=' + val, results.join(', '));
    }`);
  fs.writeFileSync('src/renderer/components/GraphingWorkspace.tsx', gw);
  console.log('GraphingWorkspace updated');
}
