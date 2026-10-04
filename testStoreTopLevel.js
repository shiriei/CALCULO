const { app } = require('electron');
const path = require('path');
const { AppStore } = require('./dist/main/main/store.js');
try {
  const store = new AppStore();
  console.log("Top level Path:", store['filePath'] || 'UNKNOWN');
} catch (e) {
  console.error("Top level Error:", e.message);
}
app.whenReady().then(() => app.quit());
