export interface AppInfo {
  name: string;
  version: string;
  electronVersion: string;
}

export type AngleMode = 'deg' | 'rad';

export interface CalculatorSettings {
  angleMode: AngleMode;
  precision: number;
  theme: 'light' | 'dark';
}

export interface CalculationRecord {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  angleMode: AngleMode;
}

export interface AppData {
  settings: CalculatorSettings;
  history: CalculationRecord[];
  memory: string | null;
}

declare global {
  interface Window {
    calculoAPI: {
      getAppInfo: () => Promise<AppInfo>;
      getSettings: () => Promise<CalculatorSettings>;
      updateSettings: (newSettings: Partial<CalculatorSettings>) => Promise<boolean>;
      getHistory: () => Promise<CalculationRecord[]>;
      addHistory: (record: Omit<CalculationRecord, 'id' | 'timestamp'>) => Promise<CalculationRecord>;
      clearHistory: () => Promise<boolean>;
      getMemory: () => Promise<string | null>;
      setMemory: (value: string | null) => Promise<boolean>;
      getAuthItem: (key: string) => Promise<string | null>;
      setAuthItem: (key: string, value: string) => Promise<void>;
      removeAuthItem: (key: string) => Promise<void>;
    };
  }
}
