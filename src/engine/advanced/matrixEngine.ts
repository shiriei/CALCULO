import { create, all } from 'mathjs';

const math = create(all);

export interface MatrixResult {
  success: boolean;
  value?: number[][];
  scalar?: number;
  error?: string;
}

export class MatrixEngine {
  private validate(a: number[][]) {
    if (!a || a.length === 0 || (a.length > 0 && a[0].length === 0)) {
      throw new Error('Matrix cannot be empty');
    }
  }

  add(matrices: number[][][]): MatrixResult {
    try {
      if (matrices.length < 2) return { success: false, error: 'Need at least two matrices' };
      matrices.forEach(m => this.validate(m));
      let res = matrices[0];
      for (let i = 1; i < matrices.length; i++) {
        res = math.add(res, matrices[i]) as number[][];
      }
      return { success: true, value: res };
    } catch (e: any) {
      return { success: false, error: e.message || 'Dimension Error' };
    }
  }

  subtract(matrices: number[][][]): MatrixResult {
    try {
      if (matrices.length < 2) return { success: false, error: 'Need at least two matrices' };
      matrices.forEach(m => this.validate(m));
      let res = matrices[0];
      for (let i = 1; i < matrices.length; i++) {
        res = math.subtract(res, matrices[i]) as number[][];
      }
      return { success: true, value: res };
    } catch (e: any) {
      return { success: false, error: e.message || 'Dimension Error' };
    }
  }

  multiply(matrices: number[][][]): MatrixResult {
    try {
      if (matrices.length < 2) return { success: false, error: 'Need at least two matrices' };
      matrices.forEach(m => this.validate(m));
      let res = matrices[0];
      for (let i = 1; i < matrices.length; i++) {
        res = math.multiply(res, matrices[i]) as number[][];
      }
      return { success: true, value: res };
    } catch (e: any) {
      return { success: false, error: e.message || 'Dimension Error' };
    }
  }

  transpose(a: number[][]): MatrixResult {
    try {
      this.validate(a);
      return { success: true, value: math.transpose(a) as number[][] };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error' };
    }
  }

  determinant(a: number[][]): MatrixResult {
    try {
      this.validate(a);
      return { success: true, scalar: math.det(a) as number };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error computing determinant' };
    }
  }

  inverse(a: number[][]): MatrixResult {
    try {
      this.validate(a);
      const det = math.det(a);
      if (Math.abs(det) < 1e-12) {
        return { success: false, error: 'Singular matrix (determinant is zero)' };
      }
      return { success: true, value: math.inv(a) as number[][] };
    } catch (e: any) {
      return { success: false, error: e.message || 'Must be a square matrix' };
    }
  }

  trace(a: number[][]): MatrixResult {
    try {
      this.validate(a);
      return { success: true, scalar: math.trace(a) as number };
    } catch (e: any) {
      return { success: false, error: e.message || 'Must be a square matrix' };
    }
  }

  power(a: number[][], exponent: number): MatrixResult {
    try {
      this.validate(a);
      if (!Number.isInteger(exponent) || exponent < 0) {
        return { success: false, error: 'Exponent must be a non-negative integer' };
      }
      return { success: true, value: math.pow(a, exponent) as number[][] };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error computing matrix power' };
    }
  }
}
