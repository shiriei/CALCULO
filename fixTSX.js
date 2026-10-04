const fs = require('fs');

function fixTSX(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the invalid syntax created by replacing '#HEX' with var(--name) without quotes
  content = content.replace(/backgroundColor:\s*var\(([^)]+)\)/g, "backgroundColor: 'var($1)'");
  content = content.replace(/background:\s*var\(([^)]+)\)/g, "background: 'var($1)'");
  content = content.replace(/color:\s*var\(([^)]+)\)/g, "color: 'var($1)'");
  content = content.replace(/border:\s*'1px solid\s*var\(([^)]+)\)'/g, "border: '1px solid var($1)'"); // in case
  content = content.replace(/border:\s*1px solid\s*var\(([^)]+)\)/g, "border: '1px solid var($1)'");
  content = content.replace(/borderBottom:\s*1px solid\s*var\(([^)]+)\)/g, "borderBottom: '1px solid var($1)'");
  content = content.replace(/borderTop:\s*1px solid\s*var\(([^)]+)\)/g, "borderTop: '1px solid var($1)'");

  fs.writeFileSync(filePath, content);
}

fixTSX('src/renderer/components/GraphingWorkspace.tsx');
console.log('GraphingWorkspace TSX inline styles fixed');
