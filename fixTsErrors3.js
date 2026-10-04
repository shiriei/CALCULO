const fs = require('fs');

let aw = fs.readFileSync('src/renderer/components/AdvancedWorkspace.tsx', 'utf8');

// Fix the undefined _onSaveHistory and TS2339 errors
aw = aw.replace(/_onSaveHistory/g, 'onSaveHistory');
// Wait, one of the components (ComplexTool) had `onSaveHistory` missing from the destructuring type or had `_onSaveHistory` in its props twice? Let's rewrite the tool signatures.
aw = aw.replace(/const ComplexTool = \(\{ angleMode, onSaveHistory \}: \{ angleMode: AngleMode, onSaveHistory\?: \(e: string, r: string\) => void \}\) => \{/g, `const ComplexTool = ({ angleMode, onSaveHistory }: { angleMode: AngleMode, onSaveHistory?: (e: string, r: string) => void }) => {`);
// In case the above didn't match, let's just make it simple:
aw = aw.replace(/const ComplexTool = .*? => \{/, `const ComplexTool = ({ angleMode, onSaveHistory }: { angleMode: AngleMode, onSaveHistory?: (e: string, r: string) => void }) => {`);
aw = aw.replace(/const VectorTool = .*? => \{/, `const VectorTool = ({ onSaveHistory }: { onSaveHistory?: (e: string, r: string) => void }) => {`);
aw = aw.replace(/const SolverTool = .*? => \{/, `const SolverTool = ({ onSaveHistory }: { onSaveHistory?: (e: string, r: string) => void }) => {`);

fs.writeFileSync('src/renderer/components/AdvancedWorkspace.tsx', aw);

let gw = fs.readFileSync('src/renderer/components/GraphingWorkspace.tsx', 'utf8');
// Fix duplicate attributes on svg
// `<svg ref={svgRef} className={styles.svgGraph} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>`
// I will strip all pointer events and add them back exactly once.
gw = gw.replace(/<svg\s+ref=\{svgRef\}\s+className=\{styles\.svgGraph\}[^>]*>/g, `<svg ref={svgRef} className={styles.svgGraph} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>`);
fs.writeFileSync('src/renderer/components/GraphingWorkspace.tsx', gw);
console.log('Fixed TS Errors');
