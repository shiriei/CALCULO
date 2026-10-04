const { app } = require('electron');
const path = require('path');
app.whenReady().then(async () => {
  try {
    const { AppStore } = require('./dist/main/main/store.js');
    const store = new AppStore();
    console.log("File path used:", store['filePath'] || 'UNKNOWN');
    console.log("Initial history:", store.getHistory().length);
    store.addHistory({ expression: '2+2', result: '4', angleMode: 'deg' });
    console.log("After add history:", store.getHistory().length);
  } catch (e) {
    console.error("Error:", e);
  }
  app.quit();
});
