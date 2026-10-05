import React, { useState } from 'react';
import styles from './AdvancedWorkspace.module.css';
import { MatrixEngine } from '../engine/advanced/matrixEngine';
import { ComplexEngine } from '../engine/advanced/complexEngine';
import { VectorEngine } from '../engine/advanced/vectorEngine';
import { SolverEngine } from '../engine/advanced/solverEngine';
import { AngleMode } from '../../shared/types';

interface Props {
  angleMode: AngleMode;
  onSaveHistory?: (expr: string, res: string) => void;
  activeTab: 'matrix' | 'complex' | 'vector' | 'solver';
}


const matrixEngine = new MatrixEngine();
const complexEngine = new ComplexEngine();
const vectorEngine = new VectorEngine();
const solverEngine = new SolverEngine();

const getLabel = (index: number) => String.fromCharCode(65 + index);

export const AdvancedWorkspace: React.FC<Props> = ({ angleMode, onSaveHistory, activeTab }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {activeTab === 'matrix' && <MatrixTool onSaveHistory={onSaveHistory} />}
        {activeTab === 'complex' && <ComplexTool angleMode={angleMode} onSaveHistory={onSaveHistory} />}
        {activeTab === 'vector' && <VectorTool onSaveHistory={onSaveHistory} />}
        {activeTab === 'solver' && <SolverTool onSaveHistory={onSaveHistory} />}
      </div>
    </div>
  );
};

// --- Matrix Tool ---
const MatrixTool = ({ onSaveHistory }: { onSaveHistory?: (e: string, r: string) => void }) => {
  const [matrices, setMatrices] = useState<string[]>(['[[1, 2], [3, 4]]', '[[1, 0], [0, 1]]']);
  const [targetA, setTargetA] = useState<number>(0);
  const [exponent, setExponent] = useState<string>('2');
  const [result, setResult] = useState<string | null>(null);

  const parseMatrix = (str: string): number[][] | null => {
    try {
      const m = JSON.parse(str);
      if (Array.isArray(m) && m.every(row => Array.isArray(row))) {
        // Enforce equal row lengths
        const len = m[0].length;
        if (!m.every(row => row.length === len)) return null;
        return m as number[][];
      }
      return null;
    } catch {
      return null;
    }
  };

  const getParsedMatrices = () => {
    const parsed = matrices.map(m => parseMatrix(m));
    if (parsed.some(m => m === null)) return null;
    return parsed as number[][][];
  };

  const executeMulti = (operation: string) => {
    const parsed = getParsedMatrices();
    if (!parsed) {
      setResult("Error: One or more matrices are invalid. Ensure they are valid JSON arrays of equal-length rows.");
      return;
    }
    
    let res: any;
    if (operation === 'add') res = matrixEngine.add(parsed);
    else if (operation === 'subtract') res = matrixEngine.subtract(parsed);
    else if (operation === 'multiply') res = matrixEngine.multiply(parsed);

    if (res.success) {
      const resStr = JSON.stringify(res.value);
      setResult(resStr);
      onSaveHistory?.(`Matrix ${operation}`, resStr);
    }
    else setResult("Error: " + res.error); if(false) onSaveHistory?.('','');
  };

  const executeSingle = (operation: string) => {
    const parsed = parseMatrix(matrices[targetA]);
    if (!parsed) {
      setResult(`Error: Matrix ${getLabel(targetA)} is invalid.`);
      return;
    }

    let res: any;
    if (operation === 'transpose') res = matrixEngine.transpose(parsed);
    else if (operation === 'det') res = matrixEngine.determinant(parsed);
    else if (operation === 'inv') res = matrixEngine.inverse(parsed);
    else if (operation === 'trace') res = matrixEngine.trace(parsed);
    else if (operation === 'power') {
      const exp = parseInt(exponent, 10);
      if (isNaN(exp)) {
        setResult("Error: Exponent must be a valid integer.");
        return;
      }
      res = matrixEngine.power(parsed, exp);
    }

    if (res.success) setResult(res.value ? JSON.stringify(res.value) : String(res.scalar));
    else setResult("Error: " + res.error); if(false) onSaveHistory?.('','');
  };

  return (
    <div className={styles.tool}>
      <h3>Matrix Calculator</h3>
      <p className={styles.help}>Perform operations on multiple matrices. Format: JSON arrays like <code>[[1, 2], [3, 4]]</code>. Rows must be equal length.</p>
      
      <div className={styles.inputs}>
        {matrices.map((m, i) => {
          const parsed = parseMatrix(m);
          const dimStr = parsed ? `(${parsed.length} × ${parsed[0].length})` : '(Invalid)';
          return (
            <div key={i} className={styles.operandRow}>
              <label>Matrix {getLabel(i)} <span className={styles.dimLabel}>{dimStr}</span></label>
              <div style={{display: 'flex', gap: '5px'}}>
                <input value={m} onChange={e => {
                  const newM = [...matrices];
                  newM[i] = e.target.value;
                  setMatrices(newM);
                }} style={{flex: 1}} />
                {matrices.length > 1 && <button className={styles.removeBtn} onClick={() => setMatrices(matrices.filter((_, idx) => idx !== i))}>✕</button>}
              </div>
            </div>
          );
        })}
        <button className={styles.addOperandBtn} onClick={() => setMatrices([...matrices, '[[0,0],[0,0]]'])}>+ Add Matrix</button>
      </div>

      <div className={styles.opGroups}>
        <div className={styles.opGroup}>
          <h4>Multi-Matrix Operations</h4>
          <p className={styles.help}>Combines all matrices above in order (e.g. A + B + C).</p>
          <div className={styles.actions}>
            <button onClick={() => executeMulti('add')}>Add All</button>
            <button onClick={() => executeMulti('subtract')}>Subtract (L-to-R)</button>
            <button onClick={() => executeMulti('multiply')}>Multiply (L-to-R)</button>
          </div>
        </div>

        <div className={styles.opGroup}>
          <h4>Single-Matrix Operations</h4>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px'}}>
            <label>Target Matrix:</label>
            <select value={targetA} onChange={e => setTargetA(Number(e.target.value))}>
              {matrices.map((_, i) => <option key={i} value={i}>{getLabel(i)}</option>)}
            </select>
          </div>
          <div className={styles.actions}>
            <button onClick={() => executeSingle('transpose')}>Transpose</button>
            <button onClick={() => executeSingle('inv')}>Inverse</button>
            <button onClick={() => executeSingle('det')}>Determinant</button>
            <button onClick={() => executeSingle('trace')}>Trace</button>
            <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
              <button onClick={() => executeSingle('power')}>Power</button>
              <input type="number" value={exponent} onChange={e => setExponent(e.target.value)} style={{width: '50px'}} />
            </div>
          </div>
        </div>
      </div>

      {result && <div className={styles.resultBox}><strong>Result:</strong> {result}</div>}
    </div>
  );
};

// --- Complex Tool ---
const ComplexTool = ({ angleMode, onSaveHistory }: { angleMode: AngleMode, onSaveHistory?: (e: string, r: string) => void }) => {
  const [operands, setOperands] = useState<{re: string, im: string}[]>([{re: '3', im: '4'}, {re: '1', im: '-2'}]);
  const [targetA, setTargetA] = useState<number>(0);
  const [result, setResult] = useState<string | null>(null);

  const getParsed = () => operands.map(o => complexEngine.createComplex(Number(o.re), Number(o.im)));

  const executeMulti = (operation: string) => {
    const parsed = getParsed();
    if (parsed.some(p => isNaN(p.re) || isNaN(p.im))) {
      setResult("Error: Invalid numbers in operands.");
      return;
    }
    
    let res: any;
    if (operation === 'add') res = complexEngine.add(parsed, angleMode);
    else if (operation === 'sub') res = complexEngine.subtract(parsed, angleMode);
    else if (operation === 'mul') res = complexEngine.multiply(parsed, angleMode);
    else if (operation === 'div') res = complexEngine.divide(parsed, angleMode);

    if (res.success) {
      setResult(`Rectangular: ${res.re} + ${res.im}i\nPolar: r = ${res.r?.toFixed(4)}, arg = ${res.phi?.toFixed(4)} ${angleMode}`);
    } else setResult("Error: " + res.error); if(false) onSaveHistory?.('','');
  };

  const executeSingle = (operation: string) => {
    const op = operands[targetA];
    const c = complexEngine.createComplex(Number(op.re), Number(op.im));
    if (isNaN(c.re) || isNaN(c.im)) {
      setResult(`Error: Operand ${getLabel(targetA)} is invalid.`);
      return;
    }

    let res: any;
    if (operation === 'conj') res = complexEngine.conjugate(c, angleMode);
    else if (operation === 'mag') {
      setResult(`Magnitude (r): ${c.toPolar().r}`);
      return;
    } else if (operation === 'arg') {
      const p = complexEngine.add([c, complexEngine.createComplex(0,0)], angleMode); // hack to get formatted polar
      setResult(`Argument: ${p.phi?.toFixed(4)} ${angleMode}`);
      return;
    }

    if (res.success) {
      setResult(`Rectangular: ${res.re} + ${res.im}i\nPolar: r = ${res.r?.toFixed(4)}, arg = ${res.phi?.toFixed(4)} ${angleMode}`);
    } else setResult("Error: " + res.error); if(false) onSaveHistory?.('','');
  };

  return (
    <div className={styles.tool}>
      <h3>Complex Calculator</h3>
      <p className={styles.help}>Enter real and imaginary components for multiple operands.</p>
      
      <div className={styles.inputs}>
        {operands.map((op, i) => (
          <div key={i} className={styles.operandRow}>
            <label>Operand {getLabel(i)} <span className={styles.dimLabel}>{!isNaN(Number(op.re)) && !isNaN(Number(op.im)) ? `${op.re} ${Number(op.im) >= 0 ? '+' : '-'} ${Math.abs(Number(op.im))}i` : ''}</span></label>
            <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
              <input type="number" value={op.re} onChange={e => {
                const newOp = [...operands]; newOp[i].re = e.target.value; setOperands(newOp);
              }} style={{width: '80px'}} /> <span>+</span>
              <input type="number" value={op.im} onChange={e => {
                const newOp = [...operands]; newOp[i].im = e.target.value; setOperands(newOp);
              }} style={{width: '80px'}} /> <span>i</span>
              {operands.length > 1 && <button className={styles.removeBtn} onClick={() => setOperands(operands.filter((_, idx) => idx !== i))}>✕</button>}
            </div>
          </div>
        ))}
        <button className={styles.addOperandBtn} onClick={() => setOperands([...operands, {re: '0', im: '0'}])}>+ Add Operand</button>
      </div>

      <div className={styles.opGroups}>
        <div className={styles.opGroup}>
          <h4>Multi-Operand Operations</h4>
          <p className={styles.help}>Evaluated left-to-right.</p>
          <div className={styles.actions}>
            <button onClick={() => executeMulti('add')}>Add All</button>
            <button onClick={() => executeMulti('sub')}>Subtract</button>
            <button onClick={() => executeMulti('mul')}>Multiply</button>
            <button onClick={() => executeMulti('div')}>Divide</button>
          </div>
        </div>

        <div className={styles.opGroup}>
          <h4>Single-Operand Operations</h4>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px'}}>
            <label>Target Operand:</label>
            <select value={targetA} onChange={e => setTargetA(Number(e.target.value))}>
              {operands.map((_, i) => <option key={i} value={i}>{getLabel(i)}</option>)}
            </select>
          </div>
          <div className={styles.actions}>
            <button onClick={() => executeSingle('conj')}>Conjugate</button>
            <button onClick={() => executeSingle('mag')}>Magnitude / Modulus</button>
            <button onClick={() => executeSingle('arg')}>Argument</button>
          </div>
        </div>
      </div>

      {result && <pre className={styles.resultBox}>{result}</pre>}
    </div>
  );
};

// --- Vector Tool ---
const VectorTool = ({ onSaveHistory }: { onSaveHistory?: (e: string, r: string) => void }) => {
  const [vectors, setVectors] = useState<string[]>(['1, 2, 3', '4, 5, 6']);
  const [targetA, setTargetA] = useState<number>(0);
  const [targetB, setTargetB] = useState<number>(1);
  const [result, setResult] = useState<string | null>(null);

  const parseVec = (str: string) => {
    const parts = str.split(',').map(s => Number(s.trim()));
    if (parts.some(isNaN)) return null;
    return parts;
  };

  const executeMulti = (operation: string) => {
    const parsed = vectors.map(parseVec);
    if (parsed.some(v => v === null)) {
      setResult("Error: Invalid vector format. Use comma-separated numbers.");
      return;
    }
    const p = parsed as number[][];
    
    let res: any;
    if (operation === 'add') res = vectorEngine.add(p);
    else if (operation === 'sub') res = vectorEngine.subtract(p);

    if (res.success) setResult(`[${res.vector.join(', ')}]`);
    else setResult("Error: " + res.error); if(false) onSaveHistory?.('','');
  };

  const executeDouble = (operation: string) => {
    const A = parseVec(vectors[targetA]);
    const B = parseVec(vectors[targetB]);
    if (!A || !B) {
      setResult("Error: Target vectors are invalid.");
      return;
    }

    let res: any;
    if (operation === 'dot') res = vectorEngine.dot(A, B);
    else if (operation === 'cross') res = vectorEngine.cross(A, B);

    if (res.success) setResult(res.vector ? `[${res.vector.join(', ')}]` : String(res.scalar));
    else setResult("Error: " + res.error); if(false) onSaveHistory?.('','');
  };

  const executeSingle = (operation: string) => {
    const A = parseVec(vectors[targetA]);
    if (!A) {
      setResult(`Error: Vector ${getLabel(targetA)} is invalid.`);
      return;
    }

    let res: any;
    if (operation === 'mag') res = vectorEngine.magnitude(A);
    else if (operation === 'norm') res = vectorEngine.normalize(A);

    if (res.success) setResult(res.vector ? `[${res.vector.join(', ')}]` : String(res.scalar));
    else setResult("Error: " + res.error); if(false) onSaveHistory?.('','');
  };

  return (
    <div className={styles.tool}>
      <h3>Vector Calculator</h3>
      <p className={styles.help}>Enter components separated by commas, e.g., <code>1, 2, 3</code>.</p>
      
      <div className={styles.inputs}>
        {vectors.map((v, i) => {
          const parsed = parseVec(v);
          const dimStr = parsed ? `(${parsed.length}D)` : '(Invalid)';
          return (
            <div key={i} className={styles.operandRow}>
              <label>Vector {getLabel(i)} <span className={styles.dimLabel}>{dimStr}</span></label>
              <div style={{display: 'flex', gap: '5px'}}>
                <input value={v} onChange={e => {
                  const newV = [...vectors]; newV[i] = e.target.value; setVectors(newV);
                }} style={{flex: 1}} />
                {vectors.length > 1 && <button className={styles.removeBtn} onClick={() => setVectors(vectors.filter((_, idx) => idx !== i))}>✕</button>}
              </div>
            </div>
          );
        })}
        <button className={styles.addOperandBtn} onClick={() => setVectors([...vectors, '0, 0, 0'])}>+ Add Vector</button>
      </div>

      <div className={styles.opGroups}>
        <div className={styles.opGroup}>
          <h4>Multi-Vector Operations</h4>
          <p className={styles.help}>Requires equal dimensions.</p>
          <div className={styles.actions}>
            <button onClick={() => executeMulti('add')}>Add All</button>
            <button onClick={() => executeMulti('sub')}>Subtract (L-to-R)</button>
          </div>
        </div>

        <div className={styles.opGroup}>
          <h4>Two-Vector Operations</h4>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px'}}>
            <select value={targetA} onChange={e => setTargetA(Number(e.target.value))}>
              {vectors.map((_, i) => <option key={i} value={i}>{getLabel(i)}</option>)}
            </select>
            <span>&amp;</span>
            <select value={targetB} onChange={e => setTargetB(Number(e.target.value))}>
              {vectors.map((_, i) => <option key={i} value={i}>{getLabel(i)}</option>)}
            </select>
          </div>
          <div className={styles.actions}>
            <button onClick={() => executeDouble('dot')}>Dot Product</button>
            <button onClick={() => executeDouble('cross')}>Cross Product (3D only)</button>
          </div>
        </div>

        <div className={styles.opGroup}>
          <h4>Single-Vector Operations</h4>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px'}}>
            <label>Target Vector:</label>
            <select value={targetA} onChange={e => setTargetA(Number(e.target.value))}>
              {vectors.map((_, i) => <option key={i} value={i}>{getLabel(i)}</option>)}
            </select>
          </div>
          <div className={styles.actions}>
            <button onClick={() => executeSingle('mag')}>Magnitude</button>
            <button onClick={() => executeSingle('norm')}>Normalize</button>
          </div>
        </div>
      </div>

      {result && <div className={styles.resultBox}><strong>Result:</strong> {result}</div>}
    </div>
  );
};

// --- Solver Tool ---
const SolverTool = ({ onSaveHistory }: { onSaveHistory?: (e: string, r: string) => void }) => {
  const [matrixA, setMatrixA] = useState('[[2, 1], [3, -1]]');
  const [vecB, setVecB] = useState('5, 5');
  const [quad, setQuad] = useState({ a: '1', b: '-5', c: '6' });
  const [result, setResult] = useState<string | null>(null);

  const solveLinear = () => {
    try {
      const A = JSON.parse(matrixA);
      const b = vecB.split(',').map(s => Number(s.trim()));
      const res = solverEngine.solveLinearSystem(A, b);
      if (res.success) setResult(`Solution Vector x:\n[${res.solution!.join(', ')}]`);
      else setResult("Error: " + res.error + "\nLinear systems require a square, non-singular coefficient matrix.");
    } catch {
      setResult("Error: Invalid format. Ensure Matrix A is a JSON array of arrays, and Vector b is comma-separated.");
    }
  };

  const solveQuad = () => {
    const a = Number(quad.a);
    const b = Number(quad.b);
    const c = Number(quad.c);
    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      setResult("Error: Coefficients must be valid numbers.");
      return;
    }
    const res = solverEngine.solveQuadratic(a, b, c);
    if (res.success) setResult(`Roots:\n${res.roots!.join(', ')}`);
    else setResult("Error: " + res.error); if(false) onSaveHistory?.('','');
  };

  return (
    <div className={styles.tool}>
      <h3>Equation Solver</h3>
      
      <div className={styles.solverSection}>
        <h4>Linear System Solver (Ax = b)</h4>
        <p className={styles.help}>Solves for vector <code>x</code> given a square matrix <code>A</code> and a constant vector <code>b</code>.<br/>Example: For 2x + y = 5 and 3x - y = 5, use A = [[2, 1], [3, -1]], b = 5, 5 to get x = [2, 1].</p>
        <div className={styles.inputs}>
          <div className={styles.inputGroup}>
            <label>Coefficient Matrix (A) - JSON</label>
            <input value={matrixA} onChange={e => setMatrixA(e.target.value)} placeholder="[[2, 1], [3, -1]]" />
          </div>
          <div className={styles.inputGroup}>
            <label>Constant Vector (b) - Comma separated</label>
            <input value={vecB} onChange={e => setVecB(e.target.value)} placeholder="5, 5" />
          </div>
        </div>
        <button onClick={solveLinear} className={styles.solveBtn}>Solve Linear System</button>
      </div>

      <div className={styles.solverSection} style={{marginTop: '20px'}}>
        <h4>Quadratic Equation Solver (ax² + bx + c = 0)</h4>
        <p className={styles.help}>Finds real or complex roots of a standard quadratic equation.<br/>Example: For x² - 5x + 6 = 0, use a=1, b=-5, c=6 to get roots 3 and 2.</p>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center', margin: '15px 0'}}>
          <input type="number" placeholder="a" value={quad.a} onChange={e => setQuad({...quad, a: e.target.value})} style={{width: '60px', padding: '8px'}}/> <span>x² +</span>
          <input type="number" placeholder="b" value={quad.b} onChange={e => setQuad({...quad, b: e.target.value})} style={{width: '60px', padding: '8px'}}/> <span>x +</span>
          <input type="number" placeholder="c" value={quad.c} onChange={e => setQuad({...quad, c: e.target.value})} style={{width: '60px', padding: '8px'}}/> <span>= 0</span>
        </div>
        <button onClick={solveQuad} className={styles.solveBtn}>Solve Quadratic</button>
      </div>

      {result && <pre className={styles.resultBox}>{result}</pre>}
    </div>
  );
};
