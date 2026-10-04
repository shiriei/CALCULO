const fs = require('fs');

let gw = fs.readFileSync('src/renderer/components/GraphingWorkspace.tsx', 'utf8');

gw = gw.replace(/const \[displayMode, setDisplayMode\] = useState<GraphDisplayMode>/, `const [sidebarOpen, setSidebarOpen] = useState(true);\n  const [displayMode, setDisplayMode] = useState<GraphDisplayMode>`);

gw = gw.replace(/<div className=\{styles\.sidebar\}>/, `{sidebarOpen && (
      <div className={styles.sidebar}>`);

gw = gw.replace(/<div className=\{styles\.graphArea\}/, `)}
      <div className={styles.graphArea}`);

gw = gw.replace(/<div className=\{styles\.graphArea\}[\s\S]*?<svg/, `<div className={styles.graphArea} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className={styles.toggleSidebarBtn}
          title={sidebarOpen ? "Collapse Controls" : "Expand Controls"}
          aria-label="Toggle Graphing Controls"
        >
          {sidebarOpen ? '◀' : '▶'} Controls
        </button>
        <svg`);

fs.writeFileSync('src/renderer/components/GraphingWorkspace.tsx', gw);

let css = fs.readFileSync('src/renderer/components/GraphingWorkspace.module.css', 'utf8');
css += `
.toggleSidebarBtn {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  background-color: var(--bg-surface-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 6px 10px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: all 0.2s;
  font-weight: 500;
  font-size: 0.85rem;
}
.toggleSidebarBtn:hover {
  background-color: var(--bg-surface-hover);
  border-color: var(--border-light);
}
`;
fs.writeFileSync('src/renderer/components/GraphingWorkspace.module.css', css);

console.log('Graph sidebar toggle added');
