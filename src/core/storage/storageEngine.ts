export interface StorageEngine {
  // Settings
  getSettings<T>(key: string): Promise<T | null>;
  setSettings<T>(key: string, value: T): Promise<void>;
  
  // Storage items
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  
  // History / Logs
  getHistory<T>(): Promise<T[]>;
  addHistoryItem<T>(item: T): Promise<void>;
  clearHistory(): Promise<void>;
}

// Example basic local storage implementation for browser
export class LocalStorageEngine implements StorageEngine {
  async getSettings<T>(key: string): Promise<T | null> {
    return this.getItem<T>(`settings_${key}`);
  }

  async setSettings<T>(key: string, value: T): Promise<void> {
    return this.setItem<T>(`settings_${key}`, value);
  }

  async getItem<T>(key: string): Promise<T | null> {
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async getHistory<T>(): Promise<T[]> {
    return (await this.getItem<T[]>('app_history')) || [];
  }

  async addHistoryItem<T>(item: T): Promise<void> {
    const history = await this.getHistory<T>();
    history.unshift(item);
    await this.setItem('app_history', history.slice(0, 100)); // keep last 100
  }

  async clearHistory(): Promise<void> {
    await this.removeItem('app_history');
  }
}
