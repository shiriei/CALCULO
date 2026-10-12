import React, { useEffect, useState } from 'react';
import styles from './components/layout/Layout.module.css';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { HistoryDrawer } from './components/layout/HistoryDrawer';
import { SettingsModal } from './components/layout/SettingsModal';
import { AuthModal } from './components/auth/AuthModal';

import { AskWorkspace } from './components/workspaces/AskWorkspace';
import { AlgebraWorkspace } from './components/workspaces/AlgebraWorkspace';
import { ScientificWorkspace } from './components/workspaces/ScientificWorkspace';
import { GraphingWorkspace } from './components/workspaces/GraphingWorkspace';
import { ToolsWorkspace } from './components/workspaces/ToolsWorkspace';

import {
  WorkspaceId,
  CalculatorSettings,
  CalculationRecord,
  AppInfo,
  AngleMode,
} from './types/frontend';

import { CalculatorEngine } from '../../src/engine/calculator';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

const calcEngine = new CalculatorEngine();

export const App: React.FC = () => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('graphing');

  // Application Settings
  const [settings, setSettings] = useState<CalculatorSettings>({
    angleMode: 'deg',
    precision: 14,
    theme: 'light',
  });

  // History & Memory
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  const [memory, setMemory] = useState<string | null>(null);

  // Overlays & Panels (History shown by default on desktop)
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Cross-workspace preloads
  const [preloadedCalcExpr, setPreloadedCalcExpr] = useState<string>('');

  // Sync theme with document element
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  // Initial Load from Electron IPC & Supabase Session
  useEffect(() => {
    const initApp = async () => {
      try {
        if (window.calculoAPI) {
          const info = await window.calculoAPI.getAppInfo();
          setAppInfo(info);

          const loadedSettings = await window.calculoAPI.getSettings();
          if (loadedSettings) {
            setSettings(loadedSettings);
            calcEngine.setAngleMode(loadedSettings.angleMode);
            calcEngine.setPrecision(loadedSettings.precision);
            document.documentElement.dataset.theme = loadedSettings.theme;
          }

          const loadedHistory = await window.calculoAPI.getHistory();
          if (loadedHistory) setHistory(loadedHistory);

          const loadedMemory = await window.calculoAPI.getMemory();
          setMemory(loadedMemory);
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }

        supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
        });
      } catch (err) {
        console.error('Failed to initialize CALCULO application:', err);
      }
    };

    initApp();
  }, []);

  // Persistence handlers
  const handleUpdateSettings = async (newSettingsPartial: Partial<CalculatorSettings>) => {
    const updated = { ...settings, ...newSettingsPartial };
    setSettings(updated);

    if (newSettingsPartial.angleMode) {
      calcEngine.setAngleMode(newSettingsPartial.angleMode);
    }
    if (typeof newSettingsPartial.precision === 'number') {
      calcEngine.setPrecision(newSettingsPartial.precision);
    }

    if (window.calculoAPI) {
      await window.calculoAPI.updateSettings(newSettingsPartial);
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    handleUpdateSettings({ theme: nextTheme });
  };

  const handleToggleAngleMode = () => {
    const nextMode: AngleMode = settings.angleMode === 'deg' ? 'rad' : 'deg';
    handleUpdateSettings({ angleMode: nextMode });
  };

  const handleSaveHistory = async (expr: string, resVal: string) => {
    if (window.calculoAPI) {
      try {
        const newRecord = await window.calculoAPI.addHistory({
          expression: expr,
          result: resVal,
          angleMode: settings.angleMode,
        });
        setHistory((prev) => [newRecord, ...prev].slice(0, 100));
      } catch (err) {
        console.error('Failed to save calculation history:', err);
      }
    } else {
      // In browser preview / fallback
      const mockRecord: CalculationRecord = {
        id: Math.random().toString(36).substr(2, 9),
        expression: expr,
        result: resVal,
        timestamp: Date.now(),
        angleMode: settings.angleMode,
      };
      setHistory((prev) => [mockRecord, ...prev].slice(0, 100));
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear all calculation history?')) {
      if (window.calculoAPI) {
        await window.calculoAPI.clearHistory();
      }
      setHistory([]);
    }
  };

  const handleUpdateMemory = async (val: string | null) => {
    setMemory(val);
    if (window.calculoAPI) {
      await window.calculoAPI.setMemory(val);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleSelectHistoryRecord = (record: CalculationRecord) => {
    setPreloadedCalcExpr(record.expression);
    setActiveWorkspace('scientific');
    setIsHistoryOpen(false);
  };

  return (
    <div className={`${styles.appLayout} ${!isHistoryOpen ? styles.appLayoutHistoryClosed : ''}`}>
      <Header
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        onToggleTheme={handleToggleTheme}
        currentTheme={settings.theme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      <Sidebar
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
      />

      <main className={styles.mainContainer}>
        {activeWorkspace === 'ask' && (
          <AskWorkspace
            onSaveHistory={handleSaveHistory}
            onNavigateWorkspace={(ws) => setActiveWorkspace(ws)}
          />
        )}

        {activeWorkspace === 'algebra' && (
          <AlgebraWorkspace
            angleMode={settings.angleMode}
            onSaveHistory={handleSaveHistory}
            onNavigateGraphing={() => setActiveWorkspace('graphing')}
          />
        )}

        {activeWorkspace === 'scientific' && (
          <ScientificWorkspace
            engine={calcEngine}
            angleMode={settings.angleMode}
            onToggleAngleMode={handleToggleAngleMode}
            memory={memory}
            onUpdateMemory={handleUpdateMemory}
            onSaveHistory={handleSaveHistory}
            initialExpression={preloadedCalcExpr}
          />
        )}

        {activeWorkspace === 'graphing' && (
          <GraphingWorkspace
            angleMode={settings.angleMode}
            onSaveHistory={handleSaveHistory}
          />
        )}

        {activeWorkspace === 'tools' && (
          <ToolsWorkspace />
        )}
      </main>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectRecord={handleSelectHistoryRecord}
        onClearHistory={handleClearHistory}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        appInfo={appInfo}
      />

      {isAuthOpen && !user && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => setIsAuthOpen(false)}
        />
      )}
    </div>
  );
};
