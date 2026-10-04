import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { AppInfo, CalculatorSettings, CalculationRecord } from '../shared/types';
import { AppStore } from './store';

const isDev = process.env.NODE_ENV === 'development';
const store = new AppStore();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 650, // Increased default width to fit expanded grids and history
    height: 600,
    minWidth: 500,
    minHeight: 500,
    title: 'CALCULO',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Remove menu for a cleaner calculator look
  mainWindow.setMenu(null);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  // Handle IPC requests securely
  ipcMain.handle('get-app-info', (): AppInfo => {
    return {
      name: 'CALCULO',
      version: app.getVersion(),
      electronVersion: process.versions.electron,
    };
  });

  ipcMain.handle('get-settings', () => store.getSettings());
  ipcMain.handle('update-settings', (_, settings: Partial<CalculatorSettings>) => store.updateSettings(settings));
  
  ipcMain.handle('get-history', () => store.getHistory());
  ipcMain.handle('add-history', (_, record: Omit<CalculationRecord, 'id'|'timestamp'>) => store.addHistory(record));
  ipcMain.handle('clear-history', () => store.clearHistory());

  ipcMain.handle('get-memory', () => store.getMemory());
  ipcMain.handle('set-memory', (_, val: string | null) => store.setMemory(val));

  ipcMain.handle('get-auth-item', (_, key: string) => store.getAuthItem(key));
  ipcMain.handle('set-auth-item', (_, key: string, value: string) => store.setAuthItem(key, value));
  ipcMain.handle('remove-auth-item', (_, key: string) => store.removeAuthItem(key));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
