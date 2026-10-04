import { contextBridge, ipcRenderer } from 'electron';
import { AppInfo, CalculatorSettings, CalculationRecord } from '../shared/types';

// Expose narrowly scoped APIs to the renderer
contextBridge.exposeInMainWorld('calculoAPI', {
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke('get-app-info'),
  getSettings: (): Promise<CalculatorSettings> => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: Partial<CalculatorSettings>): Promise<boolean> => ipcRenderer.invoke('update-settings', settings),
  getHistory: (): Promise<CalculationRecord[]> => ipcRenderer.invoke('get-history'),
  addHistory: (record: Omit<CalculationRecord, 'id'|'timestamp'>): Promise<CalculationRecord> => ipcRenderer.invoke('add-history', record),
  clearHistory: (): Promise<boolean> => ipcRenderer.invoke('clear-history'),
  getMemory: (): Promise<string | null> => ipcRenderer.invoke('get-memory'),
  setMemory: (val: string | null): Promise<boolean> => ipcRenderer.invoke('set-memory', val),
  getAuthItem: (key: string): Promise<string | null> => ipcRenderer.invoke('get-auth-item', key),
  setAuthItem: (key: string, value: string): Promise<void> => ipcRenderer.invoke('set-auth-item', key, value),
  removeAuthItem: (key: string): Promise<void> => ipcRenderer.invoke('remove-auth-item', key),
});
