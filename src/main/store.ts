import * as fs from 'fs';
import * as path from 'path';
import { app, safeStorage } from 'electron';
import * as crypto from 'crypto';
import { AppData, CalculatorSettings, CalculationRecord, AngleMode } from '../shared/types';

export class AppStore {
  private filePath: string;
  private authFilePath: string;
  private data: AppData;
  private authData: Record<string, string>;

  constructor() {
    // In testing environments without an app, fallback to current dir or mock
    const userDataPath = app ? app.getPath('userData') : __dirname;
    this.filePath = path.join(userDataPath, 'calculo-store.json');
    this.authFilePath = path.join(userDataPath, 'calculo-auth.json');
    this.data = this.loadData();
    this.authData = this.loadAuthData();
  }

  private getDefaultData(): AppData {
    return {
      settings: {
        angleMode: 'deg',
        precision: 14,
        theme: 'dark'
      },
      history: [],
      memory: null
    };
  }

  private loadData(): AppData {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(fileContent) as AppData;
        // Validation / Merging defaults
        return {
          settings: { ...this.getDefaultData().settings, ...parsed.settings },
          history: Array.isArray(parsed.history) ? parsed.history : [],
          memory: typeof parsed.memory === 'string' ? parsed.memory : null
        };
      }
    } catch (error) {
      console.error('Failed to load store, using defaults', error);
    }
    return this.getDefaultData();
  }

  private loadAuthData(): Record<string, string> {
    try {
      if (fs.existsSync(this.authFilePath)) {
        const fileContent = fs.readFileSync(this.authFilePath, 'utf-8');
        return JSON.parse(fileContent) as Record<string, string>;
      }
    } catch (error) {
      console.error('Failed to load auth store', error);
    }
    return {};
  }

  private saveData() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save store', error);
    }
  }

  private saveAuthData() {
    try {
      const dir = path.dirname(this.authFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.authFilePath, JSON.stringify(this.authData, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save auth store', error);
    }
  }

  getSettings(): CalculatorSettings {
    return this.data.settings;
  }

  updateSettings(newSettings: Partial<CalculatorSettings>): boolean {
    this.data.settings = { ...this.data.settings, ...newSettings };
    // Validate bounds e.g., precision
    if (this.data.settings.precision < 0) this.data.settings.precision = 0;
    if (this.data.settings.precision > 15) this.data.settings.precision = 15;
    this.saveData();
    return true;
  }

  getHistory(): CalculationRecord[] {
    return this.data.history;
  }

  addHistory(record: Omit<CalculationRecord, 'id' | 'timestamp'>): CalculationRecord {
    const newRecord: CalculationRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    // Add to front of history array
    this.data.history.unshift(newRecord);

    // Retention policy: Keep the last 100 calculations
    if (this.data.history.length > 100) {
      this.data.history = this.data.history.slice(0, 100);
    }

    this.saveData();
    return newRecord;
  }

  clearHistory(): boolean {
    this.data.history = [];
    this.saveData();
    return true;
  }

  getMemory(): string | null {
    return this.data.memory;
  }

  setMemory(value: string | null): boolean {
    this.data.memory = value;
    this.saveData();
    return true;
  }

  // Auth Storage
  getAuthItem(key: string): string | null {
    const encryptedHex = this.authData[key];
    if (!encryptedHex) return null;
    try {
      if (app && safeStorage.isEncryptionAvailable()) {
        const buffer = Buffer.from(encryptedHex, 'hex');
        return safeStorage.decryptString(buffer);
      }
      // Fallback if encryption not available (e.g. some dev Linux machines without keyring)
      return Buffer.from(encryptedHex, 'hex').toString('utf-8');
    } catch (e) {
      console.error('Failed to decrypt auth item', e);
      return null;
    }
  }

  setAuthItem(key: string, value: string): void {
    try {
      let encryptedHex: string;
      if (app && safeStorage.isEncryptionAvailable()) {
        encryptedHex = safeStorage.encryptString(value).toString('hex');
      } else {
        encryptedHex = Buffer.from(value, 'utf-8').toString('hex');
      }
      this.authData[key] = encryptedHex;
      this.saveAuthData();
    } catch (e) {
      console.error('Failed to encrypt auth item', e);
    }
  }

  removeAuthItem(key: string): void {
    delete this.authData[key];
    this.saveAuthData();
  }
}
