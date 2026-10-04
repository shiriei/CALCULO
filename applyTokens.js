const fs = require('fs');

function replaceTokens(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Specific inline style replacements for TSX
  content = content.replace(/'#1e1e1e'/g, 'var(--bg-input)');
  content = content.replace(/'#252526'/g, 'var(--bg-surface)');
  content = content.replace(/'#333'/g, 'var(--border-color)');
  content = content.replace(/'#444'/g, 'var(--border-light)');
  content = content.replace(/'#555'/g, 'var(--border-input)');
  content = content.replace(/'#ccc'/g, 'var(--text-secondary)');
  content = content.replace(/'#aaa'/g, 'var(--text-muted)');
  content = content.replace(/'#888'/g, 'var(--text-muted)');
  content = content.replace(/'#fff'/g, 'var(--text-primary)');
  
  // Specific SVG lines
  content = content.replace(/stroke="#444"/g, 'stroke="var(--border-light)"');
  content = content.replace(/stroke="#888"/g, 'stroke="var(--text-muted)"');
  content = content.replace(/fill="#aaa"/g, 'fill="var(--text-muted)"');
  content = content.replace(/fill="#fff"/g, 'fill="var(--text-primary)"');
  content = content.replace(/stroke="#fff"/g, 'stroke="var(--text-primary)"');
  content = content.replace(/fill="#222"/g, 'fill="var(--bg-surface-elevated)"');
  content = content.replace(/stroke="#555"/g, 'stroke="var(--border-input)"');

  fs.writeFileSync(filePath, content);
}

replaceTokens('src/renderer/components/GraphingWorkspace.tsx');
console.log('GraphingWorkspace TSX inline styles updated');
