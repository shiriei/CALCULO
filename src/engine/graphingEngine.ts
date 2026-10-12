import { create, all } from 'mathjs';
import { AngleMode } from '../shared/types';

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
  public normalizeExpression(expression: string): string {
    if (!expression) return '';
    let cleaned = expression.trim();
    // Normalize equation prefixes like y = or f(x) =
    cleaned = cleaned.replace(/^(?:y|[a-zA-Z]\s*\(\s*x\s*\))\s*=\s*/i, '');
    // Replace unicode division and multiplication
    cleaned = cleaned.replace(/÷/g, '/').replace(/×/g, '*');
    return cleaned.trim();
  }

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
          const rad = val * degToRad;
          const cosVal = Math.cos(rad);
          if (Math.abs(cosVal) < 1e-14) return NaN;
          return Math.tan(rad);
        },
        csc: (val: number) => {
          const rad = val * degToRad;
          const sinVal = Math.sin(rad);
          if (Math.abs(sinVal) < 1e-14) return NaN;
          return 1 / sinVal;
        },
        cosec: (val: number) => {
          const rad = val * degToRad;
          const sinVal = Math.sin(rad);
          if (Math.abs(sinVal) < 1e-14) return NaN;
          return 1 / sinVal;
        },
        sec: (val: number) => {
          const rad = val * degToRad;
          const cosVal = Math.cos(rad);
          if (Math.abs(cosVal) < 1e-14) return NaN;
          return 1 / cosVal;
        },
        cot: (val: number) => {
          const rad = val * degToRad;
          const sinVal = Math.sin(rad);
          if (Math.abs(sinVal) < 1e-14) return NaN;
          return Math.cos(rad) / sinVal;
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
      // Radian mode
      Object.assign(scope, {
        asin: (val: number) => {
          if (val < -1 || val > 1) return NaN;
          return math.asin(val);
        },
        acos: (val: number) => {
          if (val < -1 || val > 1) return NaN;
          return math.acos(val);
        },
        tan: (val: number) => {
          const cosVal = Math.cos(val);
          if (Math.abs(cosVal) < 1e-14) return NaN;
          return Math.tan(val);
        },
        csc: (val: number) => {
          const sinVal = Math.sin(val);
          if (Math.abs(sinVal) < 1e-14) return NaN;
          return 1 / sinVal;
        },
        cosec: (val: number) => {
          const sinVal = Math.sin(val);
          if (Math.abs(sinVal) < 1e-14) return NaN;
          return 1 / sinVal;
        },
        sec: (val: number) => {
          const cosVal = Math.cos(val);
          if (Math.abs(cosVal) < 1e-14) return NaN;
          return 1 / cosVal;
        },
        cot: (val: number) => {
          const sinVal = Math.sin(val);
          if (Math.abs(sinVal) < 1e-14) return NaN;
          return Math.cos(val) / sinVal;
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
      const cleaned = this.normalizeExpression(expression);
      if (!cleaned) return { error: 'Empty expression' };
      const compiled = math.compile(cleaned);
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

  public sampleFunction(
    func: FunctionDef, 
    xMin: number, 
    xMax: number, 
    resolution: number, 
    angleMode: AngleMode,
    yMin: number = -10,
    yMax: number = 10
  ): PlottedFunction {
    const plotted: PlottedFunction = { ...func, segments: [] };
    const rawExpr = func.expression;
    if (!rawExpr || rawExpr.trim() === '') {
      return plotted;
    }

    const cleanedExpr = this.normalizeExpression(rawExpr);
    let compiled;
    try {
      compiled = math.compile(cleanedExpr);
    } catch (e: any) {
      plotted.error = e.message || "Syntax Error";
      return plotted;
    }

    const step = (xMax - xMin) / resolution;
    let currentSegment: GraphSegment = [];
    let prevY: number | null = null;

    const yRange = Math.max(Math.abs(yMax - yMin), 1);
    const maxYMagnitude = yRange * 50;

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
      if (typeof y === 'number' && Number.isFinite(y) && !Number.isNaN(y)) {
        if (Math.abs(y) <= maxYMagnitude) {
          isValid = true;
        }
      }

      // Check for asymptotes/discontinuities between consecutive samples
      if (isValid && prevY !== null) {
        const dy = Math.abs(y - prevY);
        const oppositeSigns = (prevY > 0 && y < 0) || (prevY < 0 && y > 0);

        // 1. Pole with opposite signs (e.g. 1/x, tan(x), csc(x), sec(x), cot(x))
        if (oppositeSigns && dy > yRange * 1.5 && (Math.abs(prevY) > yRange * 0.4 || Math.abs(y) > yRange * 0.4)) {
          isValid = false;
        }
        // 2. Massive jump relative to visible viewport (e.g. 1/x^2)
        else if (dy > yRange * 25) {
          isValid = false;
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
    const expr = this.normalizeExpression(func.expression);
    if (!expr) return [];
    let compiled;
    try { compiled = math.compile(expr); } catch { return []; }
    
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
    const expr1 = this.normalizeExpression(f1.expression);
    const expr2 = this.normalizeExpression(f2.expression);
    if (!expr1 || !expr2) return [];
    let c1, c2;
    try {
      c1 = math.compile(expr1);
      c2 = math.compile(expr2);
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
