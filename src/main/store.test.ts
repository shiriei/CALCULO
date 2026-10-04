import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { AppStore } from './store';

describe('AppStore (Local Persistence)', () => {
  let store: AppStore;
  const storePath = path.join(__dirname, 'calculo-store.json');

  beforeEach(() => {
    // Clean up test file before each test
    if (fs.existsSync(storePath)) {
      fs.unlinkSync(storePath);
    }
    store = new AppStore();
  });

  afterAll(() => {
    // Final cleanup
    if (fs.existsSync(storePath)) {
      fs.unlinkSync(storePath);
    }
  });

  it('provides default settings when no file exists', () => {
    const settings = store.getSettings();
    expect(settings.angleMode).toBe('deg');
    expect(settings.precision).toBe(14);
    expect(settings.theme).toBe('dark');
  });

  it('saves and retrieves updated settings', () => {
    store.updateSettings({ angleMode: 'rad', precision: 5, theme: 'light' });
    const settings = store.getSettings();
    expect(settings.angleMode).toBe('rad');
    expect(settings.precision).toBe(5);
    expect(settings.theme).toBe('light');
    
    // Check persistence by creating a new store instance
    const store2 = new AppStore();
    expect(store2.getSettings().angleMode).toBe('rad');
  });

  it('validates precision bounds', () => {
    store.updateSettings({ precision: 20 });
    expect(store.getSettings().precision).toBe(15);
    
    store.updateSettings({ precision: -5 });
    expect(store.getSettings().precision).toBe(0);
  });

  it('adds calculation history and maintains retention policy', () => {
    expect(store.getHistory().length).toBe(0);
    
    const record = store.addHistory({
      expression: '2+2',
      result: '4',
      angleMode: 'deg'
    });
    
    expect(record.id).toBeDefined();
    expect(record.timestamp).toBeDefined();
    
    let history = store.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].expression).toBe('2+2');
    
    // Add 150 items to test retention
    for (let i = 0; i < 150; i++) {
      store.addHistory({
        expression: `${i}+1`,
        result: `${i+1}`,
        angleMode: 'deg'
      });
    }
    
    history = store.getHistory();
    expect(history.length).toBe(100);
    // The most recent should be 149+1
    expect(history[0].expression).toBe('149+1');
  });

  it('clears history', () => {
    store.addHistory({ expression: '2+2', result: '4', angleMode: 'deg' });
    store.clearHistory();
    expect(store.getHistory().length).toBe(0);
  });

  it('stores and retrieves memory', () => {
    expect(store.getMemory()).toBeNull();
    store.setMemory('42');
    expect(store.getMemory()).toBe('42');
    
    // Verify persistence
    const store2 = new AppStore();
    expect(store2.getMemory()).toBe('42');
  });
});
