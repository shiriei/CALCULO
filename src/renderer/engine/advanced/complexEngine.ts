import { create, all } from 'mathjs';
import { AngleMode } from '../../../shared/types';

const math = create(all);

export interface ComplexResult {
  success: boolean;
  re?: number;
  im?: number;
  r?: number;
  phi?: number;
  error?: string;
}

export class ComplexEngine {
  private formatOutput(c: math.Complex, angleMode: AngleMode): ComplexResult {
    const radToDeg = 180 / Math.PI;
    const phi = angleMode === 'deg' ? c.toPolar().phi * radToDeg : c.toPolar().phi;
    return {
      success: true,
      re: c.re,
      im: c.im,
      r: c.toPolar().r,
      phi
    };
  }

  createComplex(re: number, im: number): math.Complex {
    return math.complex(re, im);
  }

  createPolar(r: number, phi: number, angleMode: AngleMode): math.Complex {
    const degToRad = Math.PI / 180;
    const phiRad = angleMode === 'deg' ? phi * degToRad : phi;
    return math.complex({ r, phi: phiRad });
  }

  add(operands: math.Complex[], angleMode: AngleMode): ComplexResult {
    try {
      if (operands.length < 2) return { success: false, error: 'Need at least two operands' };
      let res = operands[0];
      for (let i = 1; i < operands.length; i++) {
        res = math.add(res, operands[i]) as math.Complex;
      }
      return this.formatOutput(res, angleMode);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  subtract(operands: math.Complex[], angleMode: AngleMode): ComplexResult {
    try {
      if (operands.length < 2) return { success: false, error: 'Need at least two operands' };
      let res = operands[0];
      for (let i = 1; i < operands.length; i++) {
        res = math.subtract(res, operands[i]) as math.Complex;
      }
      return this.formatOutput(res, angleMode);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  multiply(operands: math.Complex[], angleMode: AngleMode): ComplexResult {
    try {
      if (operands.length < 2) return { success: false, error: 'Need at least two operands' };
      let res = operands[0];
      for (let i = 1; i < operands.length; i++) {
        res = math.multiply(res, operands[i]) as math.Complex;
      }
      return this.formatOutput(res, angleMode);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  divide(operands: math.Complex[], angleMode: AngleMode): ComplexResult {
    try {
      if (operands.length < 2) return { success: false, error: 'Need at least two operands' };
      let res = operands[0];
      for (let i = 1; i < operands.length; i++) {
        if (operands[i].re === 0 && operands[i].im === 0) {
          return { success: false, error: 'Division by zero' };
        }
        res = math.divide(res, operands[i]) as math.Complex;
      }
      return this.formatOutput(res, angleMode);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  conjugate(a: math.Complex, angleMode: AngleMode): ComplexResult {
    try {
      return this.formatOutput(math.conj(a) as math.Complex, angleMode);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
