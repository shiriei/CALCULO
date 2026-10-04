const fs = require('fs');
let content = fs.readFileSync('src/renderer/components/GraphingWorkspace.tsx', 'utf8');
content = content.replace(/'1px solid #555'/g, "'1px solid var(--border-input)'");
content = content.replace(/'1px solid #333'/g, "'1px solid var(--border-color)'");
content = content.replace(/'1px solid #444'/g, "'1px solid var(--border-light)'");
fs.writeFileSync('src/renderer/components/GraphingWorkspace.tsx', content);
console.log('Graphing TSX inline styles finalized');
