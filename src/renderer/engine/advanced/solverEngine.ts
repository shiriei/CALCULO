import { create, all } from 'mathjs';

const math = create(all);

export interface SolverResult {
  success: boolean;
  solution?: number[];
  roots?: number[];
  error?: string;
  type?: 'unique' | 'infinite' | 'none';
}

export class SolverEngine {
  solveLinearSystem(A: number[][], b: number[]): SolverResult {
    try {
      if (A.length === 0 || A.length !== b.length || A[0].length !== b.length) {
        throw new Error('Matrix A must be square and match vector b length');
      }
      
      const det = math.det(A);
      if (Math.abs(det) < 1e-12) {
        return { success: false, error: 'System has no unique solution (singular matrix)' };
      }
      
      const res = math.lusolve(A, b) as number[][];
      // lusolve returns a column vector [[x], [y], ...]
      const solution = res.map(row => row[0]);
      return { success: true, solution, type: 'unique' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error solving system' };
    }
  }

  solveQuadratic(a: number, b: number, c: number): SolverResult {
    try {
      if (a === 0) {
        if (b === 0) {
          if (c === 0) return { success: true, roots: [], type: 'infinite' };
          return { success: false, error: 'No solution' };
        }
        return { success: true, roots: [-c / b] };
      }

      const discriminant = b * b - 4 * a * c;
      if (discriminant > 0) {
        const r1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const r2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        return { success: true, roots: [r1, r2] };
      } else if (Math.abs(discriminant) < 1e-12) {
        return { success: true, roots: [-b / (2 * a)] };
      } else {
        return { success: false, error: 'Roots are complex' };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
