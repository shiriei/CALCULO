import React, { useState, useEffect, useRef } from 'react';
import styles from './Workspaces.module.css';
import { CalculatorEngine, CalculationResult } from '../../../../src/engine/calculator';
import { AngleMode } from '../../types/frontend';

interface ScientificWorkspaceProps {
  engine: CalculatorEngine;
  angleMode: AngleMode;
  onToggleAngleMode: () => void;
  memory: string | null;
  onUpdateMemory: (val: string | null) => void;
  onSaveHistory: (expr: string, res: string) => void;
  initialExpression?: string;
}

// 5-column keys matching reference layout
interface KeyDef {
  code: string;
  label: string;
  type?: 'op' | 'eq' | 'cl' | 'num' | 'fn';
  cursorOffset?: number;
}

const KEYS_5COL: KeyDef[] = [
  { code: 'sin(', label: 'sin', type: 'fn', cursorOffset: 4 },
  { code: 'cos(', label: 'cos', type: 'fn', cursorOffset: 4 },
  { code: 'tan(', label: 'tan', type: 'fn', cursorOffset: 4 },
  { code: 'log(', label: 'log', type: 'fn', cursorOffset: 4 },
  { code: 'ln(', label: 'ln', type: 'fn', cursorOffset: 3 },

  { code: '(', label: '(', type: 'fn' },
  { code: ')', label: ')', type: 'fn' },
  { code: '^', label: 'xʸ', type: 'fn' },
  { code: 'sqrt(', label: '√', type: 'fn', cursorOffset: 5 },
  { code: 'pi', label: 'π', type: 'fn' },

  { code: '7', label: '7', type: 'num' },
  { code: '8', label: '8', type: 'num' },
  { code: '9', label: '9', type: 'num' },
  { code: '/', label: '÷', type: 'op' },
  { code: 'C', label: 'C', type: 'cl' },

  { code: '4', label: '4', type: 'num' },
  { code: '5', label: '5', type: 'num' },
  { code: '6', label: '6', type: 'num' },
  { code: '*', label: '×', type: 'op' },
  { code: 'BACKSPACE', label: '⌫', type: 'cl' },

  { code: '1', label: '1', type: 'num' },
  { code: '2', label: '2', type: 'num' },
  { code: '3', label: '3', type: 'num' },
  { code: '-', label: '−', type: 'op' },
  { code: 'e', label: 'e', type: 'fn' },

  { code: '0', label: '0', type: 'num' },
  { code: '.', label: '.', type: 'num' },
  { code: '*10^', label: '10ⁿ', type: 'fn' },
  { code: '+', label: '+', type: 'op' },
  { code: '=', label: '=', type: 'eq' },
];

// Expanded scientific drawer functions for power users
const EXTRA_KEYS: KeyDef[] = [
  { code: 'asin(', label: 'sin⁻¹', type: 'fn', cursorOffset: 5 },
  { code: 'acos(', label: 'cos⁻¹', type: 'fn', cursorOffset: 5 },
  { code: 'atan(', label: 'tan⁻¹', type: 'fn', cursorOffset: 5 },
  { code: 'sinh(', label: 'sinh', type: 'fn', cursorOffset: 5 },
  { code: 'cosh(', label: 'cosh', type: 'fn', cursorOffset: 5 },
  { code: 'tanh(', label: 'tanh', type: 'fn', cursorOffset: 5 },
  { code: 'abs(', label: '|x|', type: 'fn', cursorOffset: 4 },
  { code: '!', label: 'n!', type: 'fn' },
  { code: 'permutations(', label: 'nPr', type: 'fn', cursorOffset: 13 },
  { code: 'combinations(', label: 'nCr', type: 'fn', cursorOffset: 13 },
];

export const ScientificWorkspace: React.FC<ScientificWorkspaceProps> = ({
  engine,
  angleMode,
  onToggleAngleMode,
  memory,
  onUpdateMemory,
  onSaveHistory,
  initialExpression = '',
}) => {
  const [expression, setExpression] = useState(initialExpression);
  const [prevExpression, setPrevExpression] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showExtendedKeys, setShowExtendedKeys] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialExpression) {
      setExpression(initialExpression);
      handleEvaluate(initialExpression);
    }
  }, [initialExpression]);

  const handleEvaluate = (exprToEval: string = expression) => {
    const trimmed = exprToEval.trim();
    if (!trimmed) return;

    const res = engine.evaluate(trimmed);
    setResult(res);
    setPrevExpression(trimmed + ' =');

    if (res.success && res.value) {
      onSaveHistory(trimmed, res.value);
    }
  };

  const handleClear = () => {
    setExpression('');
    setPrevExpression('');
    setResult(null);
    inputRef.current?.focus();
  };

  const handleBackspace = () => {
    setExpression((prev) => {
      // Check for multi-char function token at end
      return prev.replace(/(sqrt\(|sin\(|cos\(|tan\(|log\(|ln\(|asin\(|acos\(|atan\(|sinh\(|cosh\(|tanh\(|abs\(|permutations\(|combinations\(|\*10\^|.)$/, '');
    });
    inputRef.current?.focus();
  };

  const handleKeyClick = (k: KeyDef) => {
    if (k.code === 'C') {
      handleClear();
      return;
    }
    if (k.code === 'BACKSPACE') {
      handleBackspace();
      return;
    }
    if (k.code === '=') {
      handleEvaluate();
      return;
    }

    setExpression((prev) => prev + k.code);
    inputRef.current?.focus();
  };

  // Memory Handlers
  const handleMC = () => onUpdateMemory(null);
  const handleMR = () => {
    if (memory) {
      setExpression((prev) => prev + memory);
      inputRef.current?.focus();
    }
  };
  const handleMS = () => {
    if (result?.success && result.value) {
      onUpdateMemory(result.value);
    } else if (expression) {
      const res = engine.evaluate(expression);
      if (res.success && res.value) onUpdateMemory(res.value);
    }
  };
  const handleMPlus = () => {
    const val = result?.success ? result.value : engine.evaluate(expression).value;
    if (val) {
      const current = memory || '0';
      const added = engine.evaluate(`${current} + (${val})`);
      if (added.success && added.value) onUpdateMemory(added.value);
    }
  };
  const handleMMinus = () => {
    const val = result?.success ? result.value : engine.evaluate(expression).value;
    if (val) {
      const current = memory || '0';
      const subbed = engine.evaluate(`${current} - (${val})`);
      if (subbed.success && subbed.value) onUpdateMemory(subbed.value);
    }
  };

  const displayResultText = result
    ? result.success
      ? result.value || '0'
      : result.error || 'Error'
    : expression || '0';

  return (
    <div className={styles.calcContainer}>
      <div className={styles.calcCard}>
        <div className={styles.calcTopBar}>
          <h2>Scientific calculator</h2>
          <div className={styles.calcBadges}>
            <button
              className={styles.modeBadge}
              onClick={onToggleAngleMode}
              title="Click to toggle between Degree and Radian modes"
            >
              {angleMode.toUpperCase()}
            </button>
            <button
              className={`${styles.extToggle} ${showExtendedKeys ? styles.extToggleActive : ''}`}
              onClick={() => setShowExtendedKeys(!showExtendedKeys)}
              title="Toggle extended functions (arcsin, hyperbolic, combinatorics)"
            >
              2nd
            </button>
          </div>
        </div>

        {/* Display */}
        <div className={styles.disp}>
          <div className={styles.dispTopRow}>
            {memory && <span className={styles.memBadge}>M: {memory}</span>}
            <small id="ex">{prevExpression}</small>
          </div>
          <b id="out">{displayResultText}</b>
          {result?.success && result.fractionValue && (
            <span className={styles.dispFraction}>= {result.fractionValue}</span>
          )}
        </div>

        {/* Memory Bar */}
        <div className={styles.memoryBar}>
          <button className={styles.memBtn} onClick={handleMC} disabled={!memory} title="Clear Memory">MC</button>
          <button className={styles.memBtn} onClick={handleMR} disabled={!memory} title="Recall Memory">MR</button>
          <button className={styles.memBtn} onClick={handleMPlus} title="Add to Memory">M+</button>
          <button className={styles.memBtn} onClick={handleMMinus} title="Subtract from Memory">M−</button>
          <button className={styles.memBtn} onClick={handleMS} title="Store into Memory">MS</button>
        </div>

        {/* Extended Keys Row if toggled */}
        {showExtendedKeys && (
          <div className={styles.extraKeysGrid}>
            {EXTRA_KEYS.map((k) => (
              <button
                key={k.label}
                className={`${styles.k} ${styles.kOp}`}
                onClick={() => handleKeyClick(k)}
                title={k.label}
              >
                {k.label}
              </button>
            ))}
          </div>
        )}

        {/* 5-Column Keypad */}
        <div className={styles.keys} id="keys">
          {KEYS_5COL.map((k, idx) => {
            let typeClass = '';
            if (k.type === 'op') typeClass = styles.kOp;
            else if (k.type === 'eq') typeClass = styles.kEq;
            else if (k.type === 'cl') typeClass = styles.kCl;

            return (
              <button
                key={idx}
                className={`${styles.k} ${typeClass}`}
                data-k={k.code}
                onClick={() => handleKeyClick(k)}
              >
                {k.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
