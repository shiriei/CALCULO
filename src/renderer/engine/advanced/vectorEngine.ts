import { create, all } from 'mathjs';

const math = create(all);

export interface VectorResult {
  success: boolean;
  vector?: number[];
  scalar?: number;
  error?: string;
}

export class VectorEngine {
  add(operands: number[][]): VectorResult {
    try {
      if (operands.length < 2) return { success: false, error: 'Need at least two vectors' };
      const len = operands[0].length;
      if (!operands.every(v => v.length === len)) throw new Error('Vectors must have the same length');
      
      let res = operands[0];
      for (let i = 1; i < operands.length; i++) {
        res = math.add(res, operands[i]) as number[];
      }
      return { success: true, vector: res };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  subtract(operands: number[][]): VectorResult {
    try {
      if (operands.length < 2) return { success: false, error: 'Need at least two vectors' };
      const len = operands[0].length;
      if (!operands.every(v => v.length === len)) throw new Error('Vectors must have the same length');
      
      let res = operands[0];
      for (let i = 1; i < operands.length; i++) {
        res = math.subtract(res, operands[i]) as number[];
      }
      return { success: true, vector: res };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  dot(a: number[], b: number[]): VectorResult {
    try {
      if (a.length !== b.length) throw new Error('Vectors must have the same length');
      return { success: true, scalar: math.dot(a, b) as number };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  cross(a: number[], b: number[]): VectorResult {
    try {
      if (a.length !== 3 || b.length !== 3) {
        throw new Error('Cross product requires exactly 3D vectors');
      }
      return { success: true, vector: math.cross(a, b) as number[] };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  magnitude(a: number[]): VectorResult {
    try {
      return { success: true, scalar: math.norm(a) as number };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  normalize(a: number[]): VectorResult {
    try {
      const mag = math.norm(a) as number;
      if (mag === 0) {
        throw new Error('Cannot normalize zero vector');
      }
      return { success: true, vector: math.divide(a, mag) as number[] };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
