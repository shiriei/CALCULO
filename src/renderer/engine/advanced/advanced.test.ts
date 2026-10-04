import { describe, it, expect } from 'vitest';
import { MatrixEngine } from './matrixEngine';
import { ComplexEngine } from './complexEngine';
import { VectorEngine } from './vectorEngine';
import { SolverEngine } from './solverEngine';

describe('Advanced Mathematics Engines', () => {
  describe('MatrixEngine', () => {
    const engine = new MatrixEngine();
    const A = [[1, 2], [3, 4]];
    const B = [[5, 6], [7, 8]];

    it('adds matrices', () => {
      const res = engine.add([A, B]);
      expect(res.success).toBe(true);
      expect(res.value).toEqual([[6, 8], [10, 12]]);
    });

    it('multiplies matrices', () => {
      const res = engine.multiply([A, B]);
      expect(res.success).toBe(true);
      expect(res.value).toEqual([[19, 22], [43, 50]]);
    });

    it('calculates determinant', () => {
      const res = engine.determinant(A);
      expect(res.success).toBe(true);
      expect(res.scalar).toBe(-2);
    });

    it('calculates inverse for non-singular matrix', () => {
      const res = engine.inverse(A);
      expect(res.success).toBe(true);
      expect(res.value![0][0]).toBeCloseTo(-2);
      expect(res.value![1][1]).toBeCloseTo(-0.5);
    });

    it('fails inverse for singular matrix', () => {
      const res = engine.inverse([[1, 2], [2, 4]]);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Singular matrix');
    });

    it('rejects empty matrices gracefully', () => {
      expect(engine.determinant([]).success).toBe(false);
      expect(engine.inverse([]).success).toBe(false);
      expect(engine.add([[[]]]).success).toBe(false);
    });

    it('calculates trace', () => {
      const res = engine.trace(A);
      expect(res.success).toBe(true);
      expect(res.scalar).toBe(5);
    });

    it('transposes matrix', () => {
      const res = engine.transpose(A);
      expect(res.success).toBe(true);
      expect(res.value).toEqual([[1, 3], [2, 4]]);
    });
  });

  describe('ComplexEngine', () => {
    const engine = new ComplexEngine();
    const c1 = engine.createComplex(3, 4);
    const c2 = engine.createComplex(1, -2);

    it('adds complex numbers', () => {
      const res = engine.add([c1, c2], 'rad');
      expect(res.success).toBe(true);
      expect(res.re).toBe(4);
      expect(res.im).toBe(2);
    });

    it('multiplies complex numbers', () => {
      const res = engine.multiply([c1, c2], 'rad');
      expect(res.success).toBe(true);
      expect(res.re).toBe(11); // 3*1 - 4*(-2) = 11
      expect(res.im).toBe(-2); // 3*-2 + 4*1 = -2
    });

    it('calculates modulus and arg (rad)', () => {
      const res = engine.add([c1, engine.createComplex(0, 0)], 'rad');
      expect(res.r).toBe(5); // sqrt(3^2 + 4^2)
      expect(res.phi).toBeCloseTo(0.927);
    });

    it('fails division by zero', () => {
      const zero = engine.createComplex(0, 0);
      const res = engine.divide([c1, zero], 'rad');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Division by zero');
    });
  });

  describe('VectorEngine', () => {
    const engine = new VectorEngine();
    const v1 = [1, 2, 3];
    const v2 = [4, 5, 6];

    it('adds vectors', () => {
      const res = engine.add([v1, v2]);
      expect(res.success).toBe(true);
      expect(res.vector).toEqual([5, 7, 9]);
    });

    it('calculates dot product', () => {
      const res = engine.dot(v1, v2);
      expect(res.success).toBe(true);
      expect(res.scalar).toBe(32); // 4 + 10 + 18
    });

    it('calculates cross product for 3D vectors', () => {
      const res = engine.cross(v1, v2);
      expect(res.success).toBe(true);
      expect(res.vector).toEqual([-3, 6, -3]);
    });

    it('calculates magnitude', () => {
      const res = engine.magnitude([3, 4]);
      expect(res.success).toBe(true);
      expect(res.scalar).toBe(5);
    });
    
    it('normalizes vector', () => {
      const res = engine.normalize([3, 4]);
      expect(res.success).toBe(true);
      expect(res.vector![0]).toBeCloseTo(0.6);
      expect(res.vector![1]).toBeCloseTo(0.8);
    });

    it('rejects cross product of non-3D vectors', () => {
      const res = engine.cross([1, 2], [3, 4]);
      expect(res.success).toBe(false);
    });
  });

  describe('SolverEngine', () => {
    const engine = new SolverEngine();

    it('solves linear system with unique solution', () => {
      // 2x + y = 5
      // 3x - y = 5
      // => x = 2, y = 1
      const A = [[2, 1], [3, -1]];
      const b = [5, 5];
      const res = engine.solveLinearSystem(A, b);
      expect(res.success).toBe(true);
      expect(res.solution![0]).toBeCloseTo(2);
      expect(res.solution![1]).toBeCloseTo(1);
    });

    it('detects singular linear systems', () => {
      const A = [[1, 2], [2, 4]];
      const b = [5, 10];
      const res = engine.solveLinearSystem(A, b);
      expect(res.success).toBe(false);
      expect(res.error).toContain('no unique solution');
    });

    it('solves quadratic equations with real roots', () => {
      // x^2 - 5x + 6 = 0 => x = 2, 3
      const res = engine.solveQuadratic(1, -5, 6);
      expect(res.success).toBe(true);
      expect(res.roots).toContain(2);
      expect(res.roots).toContain(3);
    });

    it('handles quadratic equations with complex roots', () => {
      const res = engine.solveQuadratic(1, 0, 1);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Roots are complex');
    });
  });
});
