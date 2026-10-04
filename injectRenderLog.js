const fs = require('fs');
let appTsx = fs.readFileSync('src/renderer/App.tsx', 'utf8');

// Inside App component
appTsx = appTsx.replace(
  /return \(\s*<div className=\{styles\.appContainer\}/,
  `
  // DEBUG FILE WRITE
  if (window.calculoAPI) {
    window.calculoAPI.addHistory({ expression: "DEBUG_RENDER", result: JSON.stringify(history), angleMode: 'deg' }).catch(e => {});
  }
  return (
    <div className={styles.appContainer}`
);

fs.writeFileSync('src/renderer/App.tsx', appTsx);
console.log("Injected render logging");
