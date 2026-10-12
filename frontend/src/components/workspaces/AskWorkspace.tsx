import React, { useState } from 'react';
import styles from './Workspaces.module.css';
import { PillButton } from '../ui/PillButton';
import { Chip } from '../ui/Chip';
import { Card } from '../ui/Card';
import { CalculatorEngine } from '../../../../src/engine/calculator';
import { SolverEngine } from '../../../../src/engine/advanced/solverEngine';
import { MatrixEngine } from '../../../../src/engine/advanced/matrixEngine';

interface AskWorkspaceProps {
  onSaveHistory: (expr: string, res: string) => void;
  onNavigateWorkspace?: (ws: 'algebra' | 'scientific' | 'graphing' | 'tools') => void;
}

const calcEngine = new CalculatorEngine();
const solverEngine = new SolverEngine();
const matrixEngine = new MatrixEngine();

const SUGGESTIONS = [
  'Solve x² − 5x + 6 = 0',
  'Determinant of a 3×3 matrix',
  '(2+3i)(1−i)',
  'sin(45) + cos(45)',
  'Solve 2x + 5 = 15',
];

export const AskWorkspace: React.FC<AskWorkspaceProps> = ({
  onSaveHistory,
  onNavigateWorkspace,
}) => {
  const [question, setQuestion] = useState('');
  const [solution, setSolution] = useState<{
    text: string;
    details?: string;
    actionLabel?: string;
    actionTarget?: 'algebra' | 'scientific' | 'graphing' | 'tools';
  } | null>(null);

  const handleSolve = (qText: string = question) => {
    const q = qText.trim();
    if (!q) return;

    // Check for quadratic pattern: e.g. "Solve x² − 5x + 6 = 0" or "x^2 - 5x + 6 = 0"
    const quadraticMatch = q.match(/(?:solve\s+)?([+-]?\s*\d*)?\s*x[\^²]2\s*([+-]\s*\d*)?\s*x\s*([+-]\s*\d+)?\s*=\s*0/i);
    if (quadraticMatch) {
      const a = parseFloat(quadraticMatch[1]?.replace(/\s+/g, '') || '1') || 1;
      const b = parseFloat(quadraticMatch[2]?.replace(/\s+/g, '') || '0') || 0;
      const c = parseFloat(quadraticMatch[3]?.replace(/\s+/g, '') || '0') || 0;
      const res = solverEngine.solveQuadratic(a, b, c);
      if (res.success && res.roots) {
        const rootStr = res.roots.map((r: number) => r.toFixed(4)).join(', ');
        const ans = `Roots: x = ${rootStr}`;
        setSolution({
          text: ans,
          details: `Solved via quadratic equation algorithm for coefficients: a=${a}, b=${b}, c=${c}`,
          actionLabel: 'Open in Algebra Solver',
          actionTarget: 'algebra'
        });
        onSaveHistory(q, ans);
        return;
      }
    }

    // Check for complex numbers like (2+3i)(1-i)
    if (q.includes('i') && (q.includes('+') || q.includes('-') || q.includes('*'))) {
      const sanitized = q.replace(/−/g, '-').replace(/\s+/g, '');
      const calcRes = calcEngine.evaluate(sanitized);
      if (calcRes.success && calcRes.value) {
        setSolution({
          text: `Result: ${calcRes.value}`,
          details: `Evaluated using complex-aware mathematical engine.`,
          actionLabel: 'Open in Complex Workspace',
          actionTarget: 'algebra'
        });
        onSaveHistory(q, calcRes.value);
        return;
      }
    }

    // Check for 3x3 determinant or matrix
    if (q.toLowerCase().includes('determinant') || q.toLowerCase().includes('matrix')) {
      const sample = [[1, 2, 3], [0, 1, 4], [5, 6, 0]];
      const det = matrixEngine.determinant(sample);
      setSolution({
        text: `Determinant calculation available in Algebra workspace`,
        details: `Example: det([[1,2,3],[0,1,4],[5,6,0]]) = ${det.success ? det.value : 'N/A'}. Use the Algebra tab for full matrix operations.`,
        actionLabel: 'Go to Matrices Tool',
        actionTarget: 'algebra'
      });
      return;
    }

    // Fallback: evaluate expression directly via calculator engine
    const sanitizedExpr = q.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    const calcRes = calcEngine.evaluate(sanitizedExpr);
    if (calcRes.success && calcRes.value) {
      setSolution({
        text: `Result: ${calcRes.value}`,
        details: calcRes.fractionValue ? `Exact fraction: ${calcRes.fractionValue}` : undefined,
        actionLabel: 'Open in Scientific Calculator',
        actionTarget: 'scientific'
      });
      onSaveHistory(q, calcRes.value);
    } else {
      setSolution({
        text: `Query analyzed: "${q}"`,
        details: `Use the dedicated tools for specialized workflows: Algebra (matrices, vectors, polynomials), 2D Graphing (curves, roots, intersections), or Scientific Calculator.`,
        actionLabel: 'Explore Algebra Tools',
        actionTarget: 'algebra'
      });
    }
  };

  return (
    <div className={styles.askContainer}>
      <div className={styles.askCard}>
        <h2 className={styles.headingCentered}>What would you like to solve?</h2>
        <p className={styles.subCentered}>
          Write any maths question: algebra, vectors, matrices, complex numbers or geometry.
        </p>

        <textarea
          id="q"
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Write your question here, e.g. Solve x² − 5x + 6 = 0 or (2+3i)(1−i)"
          className={styles.questionInput}
        />

        <div className={styles.actionBarCenter}>
          <PillButton
            variant="primary"
            onClick={() => handleSolve()}
            disabled={!question.trim()}
            id="go"
          >
            Solve
          </PillButton>
        </div>

        <div className={styles.chipsCenter}>
          {SUGGESTIONS.map((chipText) => (
            <Chip
              key={chipText}
              onClick={() => {
                setQuestion(chipText);
                handleSolve(chipText);
              }}
            >
              {chipText}
            </Chip>
          ))}
        </div>

        {solution && (
          <Card className={styles.solutionCard} id="ans">
            <div className={styles.solutionText}>{solution.text}</div>
            {solution.details && <div className={styles.solutionDetails}>{solution.details}</div>}
            {solution.actionLabel && solution.actionTarget && onNavigateWorkspace && (
              <div className={styles.solutionAction}>
                <PillButton
                  variant="primary"
                  onClick={() => onNavigateWorkspace(solution.actionTarget!)}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  {solution.actionLabel} &rarr;
                </PillButton>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
