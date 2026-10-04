import React, { useEffect, useState, useRef } from 'react';
import styles from './App.module.css';
import { AppInfo, CalculatorSettings, CalculationRecord, AngleMode } from '../shared/types';
import { CalculatorEngine, CalculationResult } from './engine/calculator';
import { AdvancedWorkspace } from './components/AdvancedWorkspace';
import { GraphingWorkspace } from './components/GraphingWorkspace';
import { AuthScreen } from './components/AuthScreen';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

const engine = new CalculatorEngine();

const App: React.FC = () => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  
  // App states
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [workspace, setWorkspace] = useState<'standard' | 'advanced' | 'graphing'>('standard');

  
  // Persistent data
  const [settings, setSettings] = useState<CalculatorSettings>({ angleMode: 'deg', precision: 14, theme: 'dark' });
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  const [memory, setMemory] = useState<string | null>(null);

  // UI state
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        if (window.calculoAPI) {
          const info = await window.calculoAPI.getAppInfo();
          setAppInfo(info);
          
          const loadedSettings = await window.calculoAPI.getSettings();
          setSettings(loadedSettings);
          engine.setAngleMode(loadedSettings.angleMode);
          engine.setPrecision(loadedSettings.precision);

          const loadedHistory = await window.calculoAPI.getHistory();
          setHistory(loadedHistory);

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
        console.error("Failed to init app:", err);
      }
    };
    initApp();
    inputRef.current?.focus();
  }, []);

  const saveToHistory = async (expr: string, resValue: string) => {
    if (window.calculoAPI) {
      const newRecord = await window.calculoAPI.addHistory({
        expression: expr,
        result: resValue,
        angleMode: settings.angleMode
      });
      setHistory(prev => [newRecord, ...prev].slice(0, 100));
    }
  };

  const handleCalculate = async (expr: string = expression) => {
    if (!expr.trim()) return;
    const res = engine.evaluate(expr);
    setResult(res);

    if (res.success && res.value) {
      await saveToHistory(expr, res.value);
    }
  };

  const insertAtCursor = (textToInsert: string, cursorOffset: number = textToInsert.length) => {
    const input = inputRef.current;
    if (!input) {
      setExpression(prev => prev + textToInsert);
      return;
    }
    
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    
    const newExpr = expression.substring(0, start) + textToInsert + expression.substring(end);
    setExpression(newExpr);
    
    // Set cursor position after React re-renders
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = start + cursorOffset;
        inputRef.current.selectionEnd = start + cursorOffset;
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleClear = () => {
    setExpression('');
    setResult(null);
    inputRef.current?.focus();
  };

  const toggleAngleMode = async () => {
    const newMode: AngleMode = settings.angleMode === 'deg' ? 'rad' : 'deg';
    const newSettings: CalculatorSettings = { ...settings, angleMode: newMode };
    setSettings(newSettings);
    engine.setAngleMode(newMode);
    if (window.calculoAPI) {
      await window.calculoAPI.updateSettings({ angleMode: newMode });
    }
    if (expression) {
      setTimeout(() => {
        const res = engine.evaluate(expression);
        setResult(res);
      }, 0);
    }
    inputRef.current?.focus();
  };

  const updatePrecision = async (p: number) => {
    const newSettings = { ...settings, precision: p };
    setSettings(newSettings);
    engine.setPrecision(p);
    if (window.calculoAPI) {
      await window.calculoAPI.updateSettings({ precision: p });
    }
    if (expression) {
      setTimeout(() => {
        const res = engine.evaluate(expression);
        setResult(res);
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalculate();
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpression(e.target.value);
  };

  // Memory Functions
  const updateMemory = async (val: string | null) => {
    setMemory(val);
    if (window.calculoAPI) await window.calculoAPI.setMemory(val);
  };

  const handleMC = () => updateMemory(null);
  const handleMR = () => {
    if (memory) insertAtCursor(memory);
  };
  const handleMS = () => {
    if (result?.success && result.value) {
      updateMemory(result.value);
    }
  };
  const handleMPlus = () => {
    if (result?.success && result.value) {
      const currentMem = memory || '0';
      const added = engine.evaluate(`${currentMem} + ${result.value}`);
      if (added.success && added.value) updateMemory(added.value);
    }
  };
  const handleMMinus = () => {
    if (result?.success && result.value) {
      const currentMem = memory || '0';
      const subbed = engine.evaluate(`${currentMem} - (${result.value})`);
      if (subbed.success && subbed.value) updateMemory(subbed.value);
    }
  };

  const clearHistory = async () => {
    if (window.confirm("Are you sure you want to clear history?")) {
      if (window.calculoAPI) {
        await window.calculoAPI.clearHistory();
        setHistory([]);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  let resultText = '0';
  let fractionText = '';
  if (result) {
    if (result.success) {
      resultText = result.value || '0';
      if (result.fractionValue) fractionText = ` = ${result.fractionValue}`;
    } else {
      resultText = result.error || 'Error';
    }
  }

  return (
    <div className={styles.appContainer} data-theme={settings.theme}>
      <header className={styles.header}>
        <h1 className={styles.title}>CALCULO</h1>
        <div className={styles.headerControls}>
          <button className={`${styles.headerBtn} ${workspace === 'standard' ? styles.activeHeaderBtn : ''}`} onClick={() => setWorkspace('standard')}>Standard</button>
          <button className={`${styles.headerBtn} ${workspace === 'advanced' ? styles.activeHeaderBtn : ''}`} onClick={() => setWorkspace('advanced')}>Advanced</button>
          <button className={`${styles.headerBtn} ${workspace === 'graphing' ? styles.activeHeaderBtn : ''}`} onClick={() => setWorkspace('graphing')}>Graphing</button>
          <button className={`${styles.headerBtn} ${showSettings ? styles.activeHeaderBtn : ''}`} onClick={() => setShowSettings(!showSettings)}>Settings</button>
          <button className={`${styles.headerBtn} ${showHistory ? styles.activeHeaderBtn : ''}`} onClick={() => setShowHistory(!showHistory)}>History</button>
          
          {user ? (
            <button className={styles.headerBtn} onClick={handleSignOut} title={`Signed in as ${user.email}`}>Sign Out</button>
          ) : (
            <button className={`${styles.headerBtn} ${showAuth ? styles.activeHeaderBtn : ''}`} onClick={() => setShowAuth(true)}>Sign In</button>
          )}
        </div>
      </header>
      
      <main className={styles.mainContent}>
        {workspace === 'standard' ? (
          <div className={styles.calculatorWorkspace}>
          <div className={styles.displayArea}>
            <div className={styles.displayHeader}>
              <span className={styles.memoryIndicator}>{memory ? `M (${memory})` : ''}</span>
              <button className={styles.modeToggle} onClick={toggleAngleMode} title="Toggle Angle Mode">
                {settings.angleMode.toUpperCase()}
              </button>
            </div>
            <input 
              ref={inputRef}
              className={styles.expressionInput} 
              value={expression}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="0"
              autoFocus
            />
            <div className={styles.resultContainer}>
              <span className={styles.result}>{resultText}</span>
              {fractionText && <span className={styles.fraction}>{fractionText}</span>}
            </div>
          </div>

          {/* Memory Row */}
          <div className={styles.memoryRow}>
            <button className={styles.btnMem} onClick={handleMC} disabled={!memory}>MC</button>
            <button className={styles.btnMem} onClick={handleMR} disabled={!memory}>MR</button>
            <button className={styles.btnMem} onClick={handleMPlus} disabled={!result?.success}>M+</button>
            <button className={styles.btnMem} onClick={handleMMinus} disabled={!result?.success}>M-</button>
            <button className={styles.btnMem} onClick={handleMS} disabled={!result?.success}>MS</button>
          </div>

          <div className={styles.keypadLayout}>
            {/* Scientific Keypad (Left) */}
            <div className={styles.scientificGrid}>
              <button className={styles.btnSci} onClick={() => insertAtCursor('sin(', 4)}>sin</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('cos(', 4)}>cos</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('tan(', 4)}>tan</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('asin(', 5)}>sin⁻¹</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('acos(', 5)}>cos⁻¹</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('atan(', 5)}>tan⁻¹</button>
              
              <button className={styles.btnSci} onClick={() => insertAtCursor('sinh(', 5)}>sinh</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('cosh(', 5)}>cosh</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('tanh(', 5)}>tanh</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('log(', 4)}>log</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('ln(', 3)}>ln</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('exp(', 4)}>exp</button>

              <button className={styles.btnSci} onClick={() => insertAtCursor('sqrt(', 5)}>√</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('^', 1)}>^</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('!', 1)}>!</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('abs(', 4)}>|x|</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('mod(', 4)}>mod</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('rem(', 4)}>rem</button>
              
              <button className={styles.btnSci} onClick={() => insertAtCursor('permutations(', 13)}>nPr</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('combinations(', 13)}>nCr</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('factorize(', 10)}>fact</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('gcd(', 4)}>gcd</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('lcm(', 4)}>lcm</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('reciprocal(', 11)}>1/x</button>
              
              <button className={styles.btnSci} onClick={() => insertAtCursor('floor(', 6)}>floor</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('ceil(', 5)}>ceil</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('round(', 6)}>round</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('pi', 2)}>π</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('e', 1)}>e</button>
              <button className={styles.btnSci} onClick={() => insertAtCursor('e', 1)}>E</button>
            </div>

            {/* Standard Keypad (Right) */}
            <div className={styles.standardGrid}>
              <button className={styles.btnDestructive} onClick={handleClear}>AC</button>
              <button className={styles.btnFunc} onClick={() => insertAtCursor('(', 1)}>(</button>
              <button className={styles.btnFunc} onClick={() => insertAtCursor(')', 1)}>)</button>
              <button className={styles.btnOp} onClick={() => insertAtCursor('/', 1)}>÷</button>
              
              <button className={styles.btnNum} onClick={() => insertAtCursor('7', 1)}>7</button>
              <button className={styles.btnNum} onClick={() => insertAtCursor('8', 1)}>8</button>
              <button className={styles.btnNum} onClick={() => insertAtCursor('9', 1)}>9</button>
              <button className={styles.btnOp} onClick={() => insertAtCursor('*', 1)}>×</button>
              
              <button className={styles.btnNum} onClick={() => insertAtCursor('4', 1)}>4</button>
              <button className={styles.btnNum} onClick={() => insertAtCursor('5', 1)}>5</button>
              <button className={styles.btnNum} onClick={() => insertAtCursor('6', 1)}>6</button>
              <button className={styles.btnOp} onClick={() => insertAtCursor('-', 1)}>-</button>
              
              <button className={styles.btnNum} onClick={() => insertAtCursor('1', 1)}>1</button>
              <button className={styles.btnNum} onClick={() => insertAtCursor('2', 1)}>2</button>
              <button className={styles.btnNum} onClick={() => insertAtCursor('3', 1)}>3</button>
              <button className={styles.btnOp} onClick={() => insertAtCursor('+', 1)}>+</button>
              
              <button className={styles.btnNum} onClick={() => insertAtCursor('0', 1)}>0</button>
              <button className={styles.btnNum} onClick={() => insertAtCursor('.', 1)}>.</button>
              <button className={styles.btnFunc} onClick={() => insertAtCursor(',', 1)}>,</button>
              <button className={styles.btnEquals} onClick={() => handleCalculate()}>=</button>
            </div>
          </div>
        </div>
        ) : workspace === 'advanced' ? (
          <AdvancedWorkspace angleMode={settings.angleMode} onSaveHistory={saveToHistory} />
        ) : (
          <GraphingWorkspace angleMode={settings.angleMode} onSaveHistory={saveToHistory} />
        )}

        {/* Settings Panel Overlay/Side */}
        {showSettings && (
          <div className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <h2>Settings</h2>
              <button aria-label="Close Settings" className={styles.btnFunc} onClick={() => setShowSettings(false)} style={{padding: '4px 8px'}}>✕</button>
            </div>
            <div className={styles.settingGroup}>
              <label>Precision (0-15): </label>
              <input 
                type="number" 
                min="0" max="15" 
                value={settings.precision} 
                onChange={(e) => updatePrecision(Number(e.target.value))}
              />
            </div>
            <div className={styles.settingGroup}>
              <label>Theme: </label>
              <select 
                value={settings.theme} 
                onChange={async (e) => {
                  const t = e.target.value as 'light'|'dark';
                  setSettings(prev => ({...prev, theme: t}));
                  if (window.calculoAPI) await window.calculoAPI.updateSettings({ theme: t });
                }}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>
        )}

        {/* History Panel */}
        {showHistory && (
          <div className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <h2>History</h2>
              <div>
                <button className={styles.btnFunc} onClick={clearHistory} style={{marginRight: '8px'}}>Clear</button>
                <button aria-label="Close History" className={styles.btnFunc} onClick={() => setShowHistory(false)} style={{padding: '4px 8px'}}>✕</button>
              </div>
            </div>
            <div className={styles.historyList}>
              {history.length === 0 ? <p className={styles.emptyText}>No history yet.</p> : null}
              {history.map(item => (
                <div key={item.id} className={styles.historyItem} onClick={() => {
                  setExpression(item.expression);
                  handleCalculate(item.expression);
                }}>
                  <div className={styles.historyExpr}>{item.expression}</div>
                  <div className={styles.historyResult}>= {item.result}</div>
                  <div className={styles.historyMeta}>
                    {new Date(item.timestamp).toLocaleTimeString()} ({item.angleMode})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Authentication Overlay */}
        {showAuth && !user && (
          <AuthScreen 
            onClose={() => setShowAuth(false)} 
            onSuccess={() => setShowAuth(false)} 
          />
        )}
      </main>

      <footer className={styles.footer}>
        {appInfo ? (
          <span>{appInfo.name} v{appInfo.version}</span>
        ) : (
          <span>Loading app info...</span>
        )}
      </footer>
    </div>
  );
};

export default App;
