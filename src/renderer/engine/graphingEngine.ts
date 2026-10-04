import { create, all } from 'mathjs';
import { AngleMode } from '../../shared/types';

const math = create(all);

export interface Point2D { x: number; y: number }
export type GraphSegment = Point2D[];

export interface DetectionResult {
  x: number;
  y: number;
  residual: number; // e.g. |f(x)| for roots, |f(x) - g(x)| for intersections
  type: 'root' | 'intersection';
}

export interface FunctionDef {
  id: string;
  expression: string;
  color: string;
}

export interface PlottedFunction extends FunctionDef {
  segments: GraphSegment[];
  error?: string;
}

export class GraphingEngine {
  private getScope(angleMode: AngleMode, xValue: number) {
    const scope: any = { x: xValue };
    
    // Override trig functions for degree mode
    if (angleMode === 'deg') {
      const radToDeg = 180 / Math.PI;
      const degToRad = Math.PI / 180;
      
      Object.assign(scope, {
          sin: (val: number) => math.sin(val * degToRad),
          cos: (val: number) => math.cos(val * degToRad),
          tan: (val: number) => {
            if (Math.abs(val % 180) === 90) return NaN; // Discontinuity
            return math.tan(val * degToRad);
          },
          asin: (val: number) => {
            if (val < -1 || val > 1) return NaN;
            return (math.asin(val) as any) * radToDeg;
          },
          acos: (val: number) => {
            if (val < -1 || val > 1) return NaN;
            return (math.acos(val) as any) * radToDeg;
          },
          atan: (val: number) => (math.atan(val) as any) * radToDeg,
      });
    } else {
      Object.assign(scope, {
        asin: (val: number) => {
          if (val < -1 || val > 1) return NaN;
          return math.asin(val);
        },
        acos: (val: number) => {
          if (val < -1 || val > 1) return NaN;
          return math.acos(val);
        }
      });
    }
    
    // Add safe reciprocal and sqrt
    Object.assign(scope, {
      sqrt: (val: number) => {
        if (val < 0) return NaN; // don't plot complex parts
        return math.sqrt(val);
      }
    });

    return scope;
  }

  public evaluateSingle(expression: string, x: number, angleMode: AngleMode): { value?: number, error?: string } {
    if (!expression || expression.trim() === '') return { error: 'Empty expression' };
    
    try {
      const compiled = math.compile(expression);
      const scope = this.getScope(angleMode, x);
      const y = compiled.evaluate(scope);

      if (math.typeOf(y) === 'Complex') {
        return { error: 'Complex result' };
      }
      
      if (typeof y === 'number' && Number.isFinite(y)) {
        return { value: y };
      }
      return { error: 'Undefined or Infinity' };
    } catch (e: any) {
      return { error: e.message || 'Syntax Error' };
    }
  }

  public sampleFunction(func: FunctionDef, xMin: number, xMax: number, resolution: number, angleMode: AngleMode): PlottedFunction {
    const plotted: PlottedFunction = { ...func, segments: [] };
    if (!func.expression || func.expression.trim() === '') {
      return plotted;
    }

    let compiled;
    try {
      compiled = math.compile(func.expression);
    } catch (e: any) {
      plotted.error = e.message || "Syntax Error";
      return plotted;
    }

    const step = (xMax - xMin) / resolution;
    let currentSegment: GraphSegment = [];

    let prevY: number | null = null;

    for (let i = 0; i <= resolution; i++) {
      const x = xMin + i * step;
      const scope = this.getScope(angleMode, x);
      
      let y: any;
      try {
        y = compiled.evaluate(scope);
      } catch (e) {
        y = NaN;
      }

      // Check if y is valid real number
      let isValid = false;
      if (typeof y === 'number' && Number.isFinite(y)) {
        isValid = true;
      }

      // Check for asymptotes/huge jumps (e.g. 1/x)
      if (isValid && prevY !== null) {
        const dy = Math.abs(y - prevY);
        // If jump is massive relative to step width, likely an asymptote
        const yRange = (xMax - xMin) * 20; // arbitrary heuristic based on typical aspect ratios
        if (dy > yRange) {
          isValid = false; // break segment
        }
      }

      if (isValid) {
        currentSegment.push({ x, y });
        prevY = y;
      } else {
        if (currentSegment.length > 0) {
          plotted.segments.push(currentSegment);
          currentSegment = [];
        }
        prevY = null;
      }
    }

    if (currentSegment.length > 0) {
      plotted.segments.push(currentSegment);
    }
    return plotted;
  }

  public findRoots(func: FunctionDef, xMin: number, xMax: number, angleMode: AngleMode, resolution: number = 500): DetectionResult[] {
    if (!func.expression || func.expression.trim() === '') return [];
    let compiled;
    try { compiled = math.compile(func.expression); } catch { return []; }
    
    const evaluate = (x: number) => {
      try {
        const y = compiled.evaluate(this.getScope(angleMode, x));
        return (typeof y === 'number' && Number.isFinite(y)) ? y : NaN;
      } catch { return NaN; }
    };

    return this.detectZeros(evaluate, xMin, xMax, resolution).map(res => ({
      x: res.x,
      y: 0,
      residual: res.residual,
      type: 'root'
    }));
  }

  public findIntersections(f1: FunctionDef, f2: FunctionDef, xMin: number, xMax: number, angleMode: AngleMode, resolution: number = 500): DetectionResult[] {
    if (!f1.expression || !f2.expression || f1.expression.trim() === '' || f2.expression.trim() === '') return [];
    let c1, c2;
    try {
      c1 = math.compile(f1.expression);
      c2 = math.compile(f2.expression);
    } catch { return []; }

    const eval1 = (x: number) => {
      try {
        const y = c1.evaluate(this.getScope(angleMode, x));
        return (typeof y === 'number' && Number.isFinite(y)) ? y : NaN;
      } catch { return NaN; }
    };
    const eval2 = (x: number) => {
      try {
        const y = c2.evaluate(this.getScope(angleMode, x));
        return (typeof y === 'number' && Number.isFinite(y)) ? y : NaN;
      } catch { return NaN; }
    };

    const diff = (x: number) => {
      const y1 = eval1(x);
      const y2 = eval2(x);
      if (Number.isNaN(y1) || Number.isNaN(y2)) return NaN;
      return y1 - y2;
    };

    const zeros = this.detectZeros(diff, xMin, xMax, resolution);
    const results: DetectionResult[] = [];
    
    for (const z of zeros) {
      const yVal = eval1(z.x);
      if (!Number.isNaN(yVal)) {
        results.push({
          x: z.x,
          y: yVal,
          residual: z.residual,
          type: 'intersection'
        });
      }
    }
    
    return results;
  }

  private detectZeros(f: (x: number) => number, xMin: number, xMax: number, resolution: number): {x: number, residual: number}[] {
    const results: {x: number, residual: number}[] = [];
    const step = (xMax - xMin) / resolution;
    
    let prevX = xMin;
    let prevY = f(prevX);

    const epsX = (xMax - xMin) * 1e-6; // Bisection tolerance
    const maxBisectionSteps = 50;
    const yThreshold = Math.max((xMax - xMin) * 1e-2, 1e-2); // Heuristic for rejecting asymptotes (e.g. 1/x)

    const addResult = (x: number, y: number) => {
      // Deduplicate
      if (results.some(r => Math.abs(r.x - x) < epsX * 10)) return;
      results.push({ x, residual: Math.abs(y) });
    };

    for (let i = 1; i <= resolution; i++) {
      const currX = xMin + i * step;
      const currY = f(currX);

      if (!Number.isNaN(prevY) && !Number.isNaN(currY)) {
        // Sign change detected
        if (prevY * currY <= 0) {
          // Bisection
          let a = prevX;
          let b = currX;
          let yA = prevY;
          
          let midX = a;
          let midY = yA;
          
          for (let k = 0; k < maxBisectionSteps; k++) {
            midX = (a + b) / 2;
            if (b - a < epsX) break;
            
            midY = f(midX);
            if (Number.isNaN(midY)) break;
            if (midY === 0) break;
            
            if (yA * midY < 0) {
              b = midX;
            } else {
              a = midX;
              yA = midY;
            }
          }
          
          midY = f(midX);
          // Reject asymptotes like 1/x which cross zero but the value at midX is huge or NaN
          if (!Number.isNaN(midY) && Math.abs(midY) < yThreshold) {
            addResult(midX, midY);
          }
        } else {
          // Check for tangent roots / near touches
          // If we are extremely close to zero, it might be a tangent root like x^2 = 0
          if (Math.abs(currY) < 1e-5) {
             addResult(currX, currY);
          }
        }
      }
      
      prevX = currX;
      prevY = currY;
    }
    
    return results;
  }
}
