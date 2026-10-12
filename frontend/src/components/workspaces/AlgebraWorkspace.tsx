import React, { useState } from 'react';
import styles from './Workspaces.module.css';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { PillButton } from '../ui/PillButton';
import { MatrixEngine } from '../../../../src/engine/advanced/matrixEngine';
import { ComplexEngine } from '../../../../src/engine/advanced/complexEngine';
import { VectorEngine } from '../../../../src/engine/advanced/vectorEngine';
import { SolverEngine } from '../../../../src/engine/advanced/solverEngine';
import { CalculatorEngine } from '../../../../src/engine/calculator';
import { AngleMode } from '../../types/frontend';

interface AlgebraWorkspaceProps {
  angleMode: AngleMode;
  onSaveHistory: (expr: string, res: string) => void;
  onNavigateGraphing?: () => void;
}

const matrixEngine = new MatrixEngine();
const complexEngine = new ComplexEngine();
const vectorEngine = new VectorEngine();
const solverEngine = new SolverEngine();
const calcEngine = new CalculatorEngine();

const getLabel = (idx: number) => String.fromCharCode(65 + idx);

export const AlgebraWorkspace: React.FC<AlgebraWorkspaceProps> = ({
  angleMode,
  onSaveHistory,
  onNavigateGraphing,
}) => {
  const [activeSection, setActiveSection] = useState<'quick' | 'matrix' | 'vector' | 'complex' | 'solver'>('quick');

  // Quick Algebra State
  const [quickExpr, setQuickExpr] = useState('');
  const [quickResult, setQuickResult] = useState<string | null>(null);

  // Matrix State
  const [matrices, setMatrices] = useState<string[]>(['[[1, 2], [3, 4]]', '[[1, 0], [0, 1]]']);
  const [targetMatrixIdx, setTargetMatrixIdx] = useState<number>(0);
  const [matrixExponent, setMatrixExponent] = useState<string>('2');
  const [matrixResult, setMatrixResult] = useState<string | null>(null);

  // Vector State
  const [vectors, setVectors] = useState<string[]>(['1, 2, 3', '4, 5, 6']);
  const [vecTargetA, setVecTargetA] = useState<number>(0);
  const [vecTargetB, setVecTargetB] = useState<number>(1);
  const [vectorResult, setVectorResult] = useState<string | null>(null);

  // Complex State
  const [operands, setOperands] = useState<Array<{ re: string; im: string }>>([
    { re: '3', im: '4' },
    { re: '1', im: '-2' },
  ]);
  const [complexTargetIdx, setComplexTargetIdx] = useState<number>(0);
  const [complexResult, setComplexResult] = useState<string | null>(null);

  // Solver State
  const [matrixA, setMatrixA] = useState<string>('[[2, 1], [3, -1]]');
  const [vecB, setVecB] = useState<string>('5, 5');
  const [quad, setQuad] = useState<{ a: string; b: string; c: string }>({ a: '1', b: '-5', c: '6' });
  const [solverResult, setSolverResult] = useState<string | null>(null);

  // Quick Action Handler
  const handleQuickAction = (action: string) => {
    if (!quickExpr.trim()) return;
    try {
      if (action === 'Simplify' || action === 'Expand') {
        const res = calcEngine.evaluate(quickExpr);
        const out = res.success ? res.value || '0' : res.error || 'Evaluation error';
        setQuickResult(out);
        onSaveHistory(`${action}(${quickExpr})`, out);
      } else if (action === 'Solve') {
        const match = quickExpr.match(/([+-]?\s*\d*)?\s*x[\^²]2\s*([+-]\s*\d*)?\s*x\s*([+-]\s*\d+)?\s*=\s*0/i);
        if (match) {
          const a = parseFloat(match[1]?.replace(/\s+/g, '') || '1') || 1;
          const b = parseFloat(match[2]?.replace(/\s+/g, '') || '0') || 0;
          const c = parseFloat(match[3]?.replace(/\s+/g, '') || '0') || 0;
          const res = solverEngine.solveQuadratic(a, b, c);
          if (res.success && res.roots) {
            const out = `Roots: ${res.roots.map((r: number) => r.toFixed(4)).join(', ')}`;
            setQuickResult(out);
            onSaveHistory(`Solve: ${quickExpr}`, out);
            return;
          }
        }
        const res = calcEngine.evaluate(quickExpr);
        setQuickResult(res.value || res.error || 'Unable to solve');
      } else {
        const res = calcEngine.evaluate(quickExpr);
        setQuickResult(res.value || res.error || 'Result computed');
      }
    } catch {
      setQuickResult('Error executing ' + action);
    }
  };

  // Matrix Helpers
  const parseMatrix = (str: string): number[][] | null => {
    try {
      const m = JSON.parse(str);
      if (Array.isArray(m) && m.every((row) => Array.isArray(row))) {
        const len = m[0].length;
        if (!m.every((row) => row.length === len)) return null;
        return m as number[][];
      }
      return null;
    } catch {
      return null;
    }
  };

  const executeMatrixMulti = (op: 'add' | 'subtract' | 'multiply') => {
    const parsed = matrices.map(parseMatrix);
    if (parsed.some((m) => m === null)) {
      setMatrixResult('Error: Invalid matrix input. Use JSON format like [[1, 2], [3, 4]]');
      return;
    }
    const res = op === 'add'
      ? matrixEngine.add(parsed as number[][][])
      : op === 'subtract'
      ? matrixEngine.subtract(parsed as number[][][])
      : matrixEngine.multiply(parsed as number[][][]);

    if (res.success) {
      const out = JSON.stringify(res.value);
      setMatrixResult(out);
      onSaveHistory(`Matrix ${op}`, out);
    } else {
      setMatrixResult('Error: ' + res.error);
    }
  };

  const executeMatrixSingle = (op: 'det' | 'transpose' | 'inv' | 'trace' | 'power') => {
    const parsed = parseMatrix(matrices[targetMatrixIdx]);
    if (!parsed) {
      setMatrixResult(`Error: Matrix ${getLabel(targetMatrixIdx)} is invalid.`);
      return;
    }
    let res: { success: boolean; value?: unknown; scalar?: number; error?: string };
    if (op === 'det') res = matrixEngine.determinant(parsed);
    else if (op === 'transpose') res = matrixEngine.transpose(parsed);
    else if (op === 'inv') res = matrixEngine.inverse(parsed);
    else if (op === 'trace') res = matrixEngine.trace(parsed);
    else {
      const exp = parseInt(matrixExponent, 10);
      if (isNaN(exp)) {
        setMatrixResult('Error: Exponent must be a valid integer.');
        return;
      }
      res = matrixEngine.power(parsed, exp);
    }

    if (res.success) {
      const out = res.value ? JSON.stringify(res.value) : String(res.scalar);
      setMatrixResult(out);
      onSaveHistory(`Matrix ${op}`, out);
    } else {
      setMatrixResult('Error: ' + res.error);
    }
  };

  // Vector Helpers
  const parseVec = (str: string): number[] | null => {
    const parts = str.split(',').map((s) => Number(s.trim()));
    if (parts.some(isNaN)) return null;
    return parts;
  };

  const executeVectorMulti = (op: 'add' | 'sub') => {
    const parsed = vectors.map(parseVec);
    if (parsed.some((v) => v === null)) {
      setVectorResult('Error: Invalid vector format. Use comma-separated numbers like 1, 2, 3');
      return;
    }
    const res = op === 'add'
      ? vectorEngine.add(parsed as number[][])
      : vectorEngine.subtract(parsed as number[][]);

    if (res.success && res.vector) {
      const out = `[${res.vector.join(', ')}]`;
      setVectorResult(out);
      onSaveHistory(`Vector ${op}`, out);
    } else {
      setVectorResult('Error: ' + res.error);
    }
  };

  const executeVectorDouble = (op: 'dot' | 'cross') => {
    const A = parseVec(vectors[vecTargetA]);
    const B = parseVec(vectors[vecTargetB]);
    if (!A || !B) {
      setVectorResult('Error: Target vectors are invalid.');
      return;
    }
    const res = op === 'dot' ? vectorEngine.dot(A, B) : vectorEngine.cross(A, B);
    if (res.success) {
      const out = res.vector ? `[${res.vector.join(', ')}]` : String(res.scalar);
      setVectorResult(out);
      onSaveHistory(`Vector ${op}`, out);
    } else {
      setVectorResult('Error: ' + res.error);
    }
  };

  const executeVectorSingle = (op: 'mag' | 'norm') => {
    const A = parseVec(vectors[vecTargetA]);
    if (!A) {
      setVectorResult(`Error: Vector ${getLabel(vecTargetA)} is invalid.`);
      return;
    }
    const res = op === 'mag' ? vectorEngine.magnitude(A) : vectorEngine.normalize(A);
    if (res.success) {
      const out = res.vector ? `[${res.vector.join(', ')}]` : String(res.scalar);
      setVectorResult(out);
      onSaveHistory(`Vector ${op}`, out);
    } else {
      setVectorResult('Error: ' + res.error);
    }
  };

  // Complex Helpers
  const getParsedComplex = () =>
    operands.map((o) => complexEngine.createComplex(Number(o.re), Number(o.im)));

  const executeComplexMulti = (op: 'add' | 'sub' | 'mul' | 'div') => {
    const parsed = getParsedComplex();
    if (parsed.some((p) => isNaN(p.re) || isNaN(p.im))) {
      setComplexResult('Error: Invalid numbers in operands.');
      return;
    }
    const res = op === 'add'
      ? complexEngine.add(parsed, angleMode)
      : op === 'sub'
      ? complexEngine.subtract(parsed, angleMode)
      : op === 'mul'
      ? complexEngine.multiply(parsed, angleMode)
      : complexEngine.divide(parsed, angleMode);

    if (res.success) {
      const out = `Rectangular: ${res.re} + ${res.im}i\nPolar: r = ${res.r?.toFixed(4)}, arg = ${res.phi?.toFixed(4)} ${angleMode.toUpperCase()}`;
      setComplexResult(out);
      onSaveHistory(`Complex ${op}`, out);
    } else {
      setComplexResult('Error: ' + res.error);
    }
  };

  const executeComplexSingle = (op: 'conj' | 'mag' | 'arg') => {
    const opItem = operands[complexTargetIdx];
    const c = complexEngine.createComplex(Number(opItem.re), Number(opItem.im));
    if (isNaN(c.re) || isNaN(c.im)) {
      setComplexResult(`Error: Operand ${getLabel(complexTargetIdx)} is invalid.`);
      return;
    }
    if (op === 'mag') {
      const magVal = c.toPolar().r;
      const out = `Magnitude (r): ${magVal.toFixed(4)}`;
      setComplexResult(out);
      onSaveHistory(`Complex magnitude`, out);
      return;
    }
    if (op === 'arg') {
      const p = complexEngine.add([c, complexEngine.createComplex(0, 0)], angleMode);
      const out = `Argument (θ): ${p.phi?.toFixed(4)} ${angleMode.toUpperCase()}`;
      setComplexResult(out);
      onSaveHistory(`Complex argument`, out);
      return;
    }
    const res = complexEngine.conjugate(c, angleMode);
    if (res.success) {
      const out = `Conjugate: ${res.re} + ${res.im}i`;
      setComplexResult(out);
      onSaveHistory(`Complex conjugate`, out);
    } else {
      setComplexResult('Error: ' + res.error);
    }
  };

  // Solver Handlers
  const handleSolveLinear = () => {
    try {
      const A = JSON.parse(matrixA);
      const b = vecB.split(',').map((s) => Number(s.trim()));
      const res = solverEngine.solveLinearSystem(A, b);
      if (res.success && res.solution) {
        const out = `Solution Vector x:\n[${res.solution.join(', ')}]`;
        setSolverResult(out);
        onSaveHistory('Solve Ax=b', out);
      } else {
        setSolverResult('Error: ' + (res.error || 'System could not be solved.'));
      }
    } catch {
      setSolverResult('Error: Invalid format. Ensure Matrix A is JSON and Vector b is comma-separated.');
    }
  };

  const handleSolveQuad = () => {
    const a = Number(quad.a);
    const b = Number(quad.b);
    const c = Number(quad.c);
    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      setSolverResult('Error: Coefficients must be valid numbers.');
      return;
    }
    const res = solverEngine.solveQuadratic(a, b, c);
    if (res.success && res.roots) {
      const out = `Roots:\n${res.roots.map((r: number) => r.toFixed(4)).join(', ')}`;
      setSolverResult(out);
      onSaveHistory(`Solve ${a}x² + ${b}x + ${c} = 0`, out);
    } else {
      setSolverResult('Error: ' + (res.error || 'No real roots.'));
    }
  };

  return (
    <div className={styles.algebraContainer}>
      <div className={styles.algebraCard}>
        <div className={styles.sectionHeader}>
          <h2>Algebra</h2>
          <div className={styles.tabPillBar}>
            <button
              className={`${styles.tabPill} ${activeSection === 'quick' ? styles.tabPillActive : ''}`}
              onClick={() => setActiveSection('quick')}
            >
              Overview
            </button>
            <button
              className={`${styles.tabPill} ${activeSection === 'matrix' ? styles.tabPillActive : ''}`}
              onClick={() => setActiveSection('matrix')}
            >
              Matrices
            </button>
            <button
              className={`${styles.tabPill} ${activeSection === 'vector' ? styles.tabPillActive : ''}`}
              onClick={() => setActiveSection('vector')}
            >
              Vectors
            </button>
            <button
              className={`${styles.tabPill} ${activeSection === 'complex' ? styles.tabPillActive : ''}`}
              onClick={() => setActiveSection('complex')}
            >
              Complex
            </button>
            <button
              className={`${styles.tabPill} ${activeSection === 'solver' ? styles.tabPillActive : ''}`}
              onClick={() => setActiveSection('solver')}
            >
              Solvers
            </button>
          </div>
        </div>

        {activeSection === 'quick' && (
          <>
            <Card className={styles.quickCard}>
              <input
                type="text"
                id="ae"
                value={quickExpr}
                onChange={(e) => setQuickExpr(e.target.value)}
                placeholder="Enter an expression or equation, e.g. 2x + 3 = 11 or x^2 - 5x + 6 = 0"
                className={styles.algebraInput}
              />
              <div className={styles.chips}>
                {['Simplify', 'Expand', 'Factor', 'Solve', 'Differentiate', 'Integrate'].map((chip) => (
                  <Chip key={chip} onClick={() => handleQuickAction(chip)}>
                    {chip}
                  </Chip>
                ))}
              </div>
              {quickResult && (
                <div className={styles.algebraResultBox}>
                  <strong>Result:</strong> {quickResult}
                </div>
              )}
            </Card>

            <div className={styles.grid2}>
              <Card className={styles.toolCard} onClick={() => setActiveSection('matrix')}>
                <b>Matrices</b>
                <p className={styles.subText}>Add, multiply, invert, determinant, trace, power.</p>
              </Card>

              <Card className={styles.toolCard} onClick={() => setActiveSection('vector')}>
                <b>Vectors</b>
                <p className={styles.subText}>Dot, cross, magnitude, normalize, linear combinations.</p>
              </Card>

              <Card className={styles.toolCard} onClick={() => setActiveSection('complex')}>
                <b>Complex numbers</b>
                <p className={styles.subText}>Rectangular, polar form, conjugate, magnitude, argument.</p>
              </Card>

              <Card className={styles.toolCard} onClick={() => (onNavigateGraphing ? onNavigateGraphing() : null)}>
                <b>Graphing</b>
                <p className={styles.subText}>Plot functions and find intersections, roots & extrema.</p>
              </Card>
            </div>
          </>
        )}

        {/* Matrices */}
        {activeSection === 'matrix' && (
          <div className={styles.subToolPanel}>
            <h3>Matrix Calculator</h3>
            <p className={styles.subText}>
              Perform operations on matrices in JSON format: <code>[[1, 2], [3, 4]]</code>.
            </p>

            <div className={styles.formGrid}>
              {matrices.map((m, i) => (
                <div key={i}>
                  <label className={styles.label}>Matrix {getLabel(i)}:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      className={styles.algebraInput}
                      value={m}
                      onChange={(e) => {
                        const newM = [...matrices];
                        newM[i] = e.target.value;
                        setMatrices(newM);
                      }}
                    />
                    {matrices.length > 1 && (
                      <button
                        className={styles.removeFunctionBtn}
                        onClick={() => setMatrices(matrices.filter((_, idx) => idx !== i))}
                        title="Remove matrix"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '8px' }}>
              <PillButton
                onClick={() => setMatrices([...matrices, '[[1, 0], [0, 1]]'])}
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                + Add Matrix
              </PillButton>
            </div>

            <div className={styles.chipRow} style={{ marginTop: '12px' }}>
              <strong>Multi-Matrix:</strong>
              <Chip onClick={() => executeMatrixMulti('add')}>Add All</Chip>
              <Chip onClick={() => executeMatrixMulti('subtract')}>Subtract</Chip>
              <Chip onClick={() => executeMatrixMulti('multiply')}>Multiply</Chip>
            </div>

            <div className={styles.chipRow} style={{ marginTop: '8px', alignItems: 'center' }}>
              <strong>Single-Matrix ({getLabel(targetMatrixIdx)}):</strong>
              <select
                value={targetMatrixIdx}
                onChange={(e) => setTargetMatrixIdx(Number(e.target.value))}
                className={styles.graphSelect}
                style={{ width: 'auto' }}
              >
                {matrices.map((_, i) => (
                  <option key={i} value={i}>
                    Matrix {getLabel(i)}
                  </option>
                ))}
              </select>
              <Chip onClick={() => executeMatrixSingle('det')}>Determinant</Chip>
              <Chip onClick={() => executeMatrixSingle('transpose')}>Transpose</Chip>
              <Chip onClick={() => executeMatrixSingle('inv')}>Inverse</Chip>
              <Chip onClick={() => executeMatrixSingle('trace')}>Trace</Chip>
              <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                <Chip onClick={() => executeMatrixSingle('power')}>Power</Chip>
                <input
                  type="number"
                  value={matrixExponent}
                  onChange={(e) => setMatrixExponent(e.target.value)}
                  style={{ width: '50px', padding: '4px 6px' }}
                />
              </div>
            </div>

            {matrixResult && (
              <div className={styles.algebraResultBox} style={{ marginTop: '12px' }}>
                <strong>Matrix Result:</strong> {matrixResult}
              </div>
            )}
          </div>
        )}

        {/* Vectors */}
        {activeSection === 'vector' && (
          <div className={styles.subToolPanel}>
            <h3>Vector Calculator</h3>
            <p className={styles.subText}>Enter components separated by commas, e.g., <code>1, 2, 3</code>.</p>

            <div className={styles.formGrid}>
              {vectors.map((v, i) => (
                <div key={i}>
                  <label className={styles.label}>Vector {getLabel(i)}:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      className={styles.algebraInput}
                      value={v}
                      onChange={(e) => {
                        const newV = [...vectors];
                        newV[i] = e.target.value;
                        setVectors(newV);
                      }}
                    />
                    {vectors.length > 1 && (
                      <button
                        className={styles.removeFunctionBtn}
                        onClick={() => setVectors(vectors.filter((_, idx) => idx !== i))}
                        title="Remove vector"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '8px' }}>
              <PillButton
                onClick={() => setVectors([...vectors, '0, 0, 0'])}
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                + Add Vector
              </PillButton>
            </div>

            <div className={styles.chipRow} style={{ marginTop: '12px' }}>
              <strong>Multi-Vector:</strong>
              <Chip onClick={() => executeVectorMulti('add')}>Add All</Chip>
              <Chip onClick={() => executeVectorMulti('sub')}>Subtract</Chip>
            </div>

            <div className={styles.chipRow} style={{ marginTop: '8px', alignItems: 'center' }}>
              <strong>Two Vectors:</strong>
              <select
                value={vecTargetA}
                onChange={(e) => setVecTargetA(Number(e.target.value))}
                className={styles.graphSelect}
                style={{ width: 'auto' }}
              >
                {vectors.map((_, i) => (
                  <option key={i} value={i}>
                    Vector {getLabel(i)}
                  </option>
                ))}
              </select>
              <span>&amp;</span>
              <select
                value={vecTargetB}
                onChange={(e) => setVecTargetB(Number(e.target.value))}
                className={styles.graphSelect}
                style={{ width: 'auto' }}
              >
                {vectors.map((_, i) => (
                  <option key={i} value={i}>
                    Vector {getLabel(i)}
                  </option>
                ))}
              </select>
              <Chip onClick={() => executeVectorDouble('dot')}>Dot Product</Chip>
              <Chip onClick={() => executeVectorDouble('cross')}>Cross Product (3D)</Chip>
            </div>

            <div className={styles.chipRow} style={{ marginTop: '8px', alignItems: 'center' }}>
              <strong>Single Vector:</strong>
              <Chip onClick={() => executeVectorSingle('mag')}>Magnitude</Chip>
              <Chip onClick={() => executeVectorSingle('norm')}>Normalize</Chip>
            </div>

            {vectorResult && (
              <div className={styles.algebraResultBox} style={{ marginTop: '12px' }}>
                <strong>Vector Result:</strong> {vectorResult}
              </div>
            )}
          </div>
        )}

        {/* Complex Numbers */}
        {activeSection === 'complex' && (
          <div className={styles.subToolPanel}>
            <h3>Complex Numbers</h3>
            <p className={styles.subText}>Enter real and imaginary components for multiple operands.</p>

            <div className={styles.formGrid}>
              {operands.map((op, i) => (
                <div key={i}>
                  <label className={styles.label}>Operand {getLabel(i)}:</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={op.re}
                      onChange={(e) => {
                        const newOps = [...operands];
                        newOps[i].re = e.target.value;
                        setOperands(newOps);
                      }}
                      className={styles.algebraInput}
                      style={{ width: '90px' }}
                    />
                    <span>+</span>
                    <input
                      type="number"
                      value={op.im}
                      onChange={(e) => {
                        const newOps = [...operands];
                        newOps[i].im = e.target.value;
                        setOperands(newOps);
                      }}
                      className={styles.algebraInput}
                      style={{ width: '90px' }}
                    />
                    <span>i</span>
                    {operands.length > 1 && (
                      <button
                        className={styles.removeFunctionBtn}
                        onClick={() => setOperands(operands.filter((_, idx) => idx !== i))}
                        title="Remove operand"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '8px' }}>
              <PillButton
                onClick={() => setOperands([...operands, { re: '0', im: '0' }])}
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                + Add Operand
              </PillButton>
            </div>

            <div className={styles.chipRow} style={{ marginTop: '12px' }}>
              <strong>Multi-Operand:</strong>
              <Chip onClick={() => executeComplexMulti('add')}>Add</Chip>
              <Chip onClick={() => executeComplexMulti('sub')}>Subtract</Chip>
              <Chip onClick={() => executeComplexMulti('mul')}>Multiply</Chip>
              <Chip onClick={() => executeComplexMulti('div')}>Divide</Chip>
            </div>

            <div className={styles.chipRow} style={{ marginTop: '8px', alignItems: 'center' }}>
              <strong>Single Operand ({getLabel(complexTargetIdx)}):</strong>
              <select
                value={complexTargetIdx}
                onChange={(e) => setComplexTargetIdx(Number(e.target.value))}
                className={styles.graphSelect}
                style={{ width: 'auto' }}
              >
                {operands.map((_, i) => (
                  <option key={i} value={i}>
                    Operand {getLabel(i)}
                  </option>
                ))}
              </select>
              <Chip onClick={() => executeComplexSingle('conj')}>Conjugate</Chip>
              <Chip onClick={() => executeComplexSingle('mag')}>Magnitude (r)</Chip>
              <Chip onClick={() => executeComplexSingle('arg')}>Argument (θ)</Chip>
            </div>

            {complexResult && (
              <pre className={styles.algebraResultBox} style={{ marginTop: '12px' }}>
                {complexResult}
              </pre>
            )}
          </div>
        )}

        {/* Solvers */}
        {activeSection === 'solver' && (
          <div className={styles.subToolPanel}>
            <h3>Equation Solvers</h3>

            {/* Linear System Ax = b */}
            <div style={{ marginBottom: '16px' }}>
              <h4>Linear System Solver (Ax = b)</h4>
              <p className={styles.subText}>
                Solves for vector x given square matrix A and constant vector b. Example: A = [[2, 1], [3, -1]], b = 5, 5
              </p>
              <div className={styles.formGrid} style={{ marginTop: '8px' }}>
                <div>
                  <label className={styles.label}>Coefficient Matrix (A) - JSON</label>
                  <input
                    type="text"
                    value={matrixA}
                    onChange={(e) => setMatrixA(e.target.value)}
                    className={styles.algebraInput}
                  />
                </div>
                <div>
                  <label className={styles.label}>Constant Vector (b) - Comma-separated</label>
                  <input
                    type="text"
                    value={vecB}
                    onChange={(e) => setVecB(e.target.value)}
                    className={styles.algebraInput}
                  />
                </div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <PillButton variant="primary" onClick={handleSolveLinear}>
                  Solve Linear System
                </PillButton>
              </div>
            </div>

            {/* Quadratic ax² + bx + c = 0 */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <h4>Quadratic Equation Solver (ax² + bx + c = 0)</h4>
              <p className={styles.subText}>Finds real roots of standard quadratic equation.</p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                <input
                  type="number"
                  placeholder="a"
                  value={quad.a}
                  onChange={(e) => setQuad({ ...quad, a: e.target.value })}
                  style={{ width: '70px', padding: '8px' }}
                />
                <span>x² +</span>
                <input
                  type="number"
                  placeholder="b"
                  value={quad.b}
                  onChange={(e) => setQuad({ ...quad, b: e.target.value })}
                  style={{ width: '70px', padding: '8px' }}
                />
                <span>x +</span>
                <input
                  type="number"
                  placeholder="c"
                  value={quad.c}
                  onChange={(e) => setQuad({ ...quad, c: e.target.value })}
                  style={{ width: '70px', padding: '8px' }}
                />
                <span>= 0</span>
              </div>
              <div style={{ marginTop: '10px' }}>
                <PillButton variant="primary" onClick={handleSolveQuad}>
                  Solve Quadratic
                </PillButton>
              </div>
            </div>

            {solverResult && (
              <pre className={styles.algebraResultBox} style={{ marginTop: '14px' }}>
                {solverResult}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
