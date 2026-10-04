import { create, all } from 'mathjs';

// Create a custom mathjs instance
const math = create(all);

export type AngleMode = 'deg' | 'rad';

export interface CalculationResult {
  success: boolean;
  value?: string;
  fractionValue?: string;
  error?: string;
}

export class CalculatorEngine {
  private angleMode: AngleMode = 'deg';
  private precision: number = 14;

  setAngleMode(mode: AngleMode) {
    this.angleMode = mode;
  }

  getAngleMode(): AngleMode {
    return this.angleMode;
  }

  setPrecision(precision: number) {
    this.precision = precision;
  }

  getPrecision(): number {
    return this.precision;
  }

  evaluate(expression: string): CalculationResult {
    if (!expression || expression.trim() === '') {
      return { success: true, value: '' };
    }

    try {
      // Replace non-standard characters from UI
      let parsedExpr = expression.replace(/÷/g, '/').replace(/×/g, '*');

      const scope = {
        // Safe factorial wrapper to prevent UI freezing
        fact: (n: number) => {
          if (n > 170) throw new Error('Domain Error: Factorial too large');
          if (n < 0 || !Number.isInteger(n)) throw new Error('Domain Error: Factorial of non-integer');
          return math.factorial(n);
        },
        permutations: (n: number, k: number) => {
          if (n > 1000) throw new Error('Domain Error: n too large');
          return math.permutations(n, k);
        },
        combinations: (n: number, k: number) => {
          if (n > 1000) throw new Error('Domain Error: n too large');
          return math.combinations(n, k);
        },
        // Remainder vs modulo. Math.js `mod` is actual modulo.
        rem: (x: number, y: number) => x % y,
        reciprocal: (x: number) => {
          if (x === 0) throw new Error('Math Error: Division by zero');
          return 1 / x;
        },
        // Simple prime factorization
        factorize: (n: number) => {
          if (!Number.isInteger(n) || n <= 0) throw new Error('Domain Error: Positive integer required');
          if (n > 1e9) throw new Error('Domain Error: Number too large for factorization');
          const factors: number[] = [];
          let d = 2;
          let temp = n;
          while (temp > 1 && d * d <= temp) {
            while (temp % d === 0) {
              factors.push(d);
              temp /= d;
            }
            d++;
          }
          if (temp > 1) factors.push(temp);
          return factors.join(' * ');
        }
      };
      
      // Override trig functions for degree mode
      if (this.angleMode === 'deg') {
        const radToDeg = 180 / Math.PI;
        const degToRad = Math.PI / 180;
        
        Object.assign(scope, {
            sin: (x: number) => math.sin(x * degToRad),
            cos: (x: number) => math.cos(x * degToRad),
            tan: (x: number) => {
              if (Math.abs(x % 180) === 90) throw new Error('Domain Error');
              return math.tan(x * degToRad);
            },
            asin: (x: number) => {
              if (x < -1 || x > 1) throw new Error('Domain Error');
              return (math.asin(x) as any) * radToDeg;
            },
            acos: (x: number) => {
              if (x < -1 || x > 1) throw new Error('Domain Error');
              return (math.acos(x) as any) * radToDeg;
            },
            atan: (x: number) => (math.atan(x) as any) * radToDeg,
        });
      } else {
        // Enforce domains for rad mode too
        Object.assign(scope, {
          asin: (x: number) => {
            if (x < -1 || x > 1) throw new Error('Domain Error');
            return math.asin(x);
          },
          acos: (x: number) => {
            if (x < -1 || x > 1) throw new Error('Domain Error');
            return math.acos(x);
          }
        });
      }
      
      // We also override ! operator parsing by intercepting it in the string? 
      // It's safer to just replace ! with fact() for huge numbers but math.js compiles first.
      // MathJS allows custom functions, but operators like `!` map to factorial. 
      // We can intercept the node in AST or just catch the error.
      // Wait, math.js `math.factorial` will just return Infinity for large numbers, it doesn't freeze for 1000! unless BigNumber is used.
      // Since we use standard numbers, `1000!` is just Infinity. UI won't freeze.
      
      const compiled = math.compile(parsedExpr);
      let res = compiled.evaluate(scope);

      // Handle edge cases
      if (res === Infinity || res === -Infinity) {
        return { success: false, error: 'Math Error' };
      }
      if (typeof res === 'number' && isNaN(res)) {
        return { success: false, error: 'Domain Error' };
      }
      
      // If res is a string (e.g. from factorize), return it directly
      if (typeof res === 'string') {
        return { success: true, value: res };
      }

      // If res is a Complex number (e.g. sqrt(-1))
      if (math.typeOf(res) === 'Complex') {
        return { success: true, value: res.toString() };
      }

      // Determine fraction representation if reasonable
      let fractionValue: string | undefined = undefined;
      if (typeof res === 'number' && Number.isFinite(res) && !Number.isInteger(res)) {
        try {
          const frac = math.fraction(res);
          // Only show fraction if denominator is reasonable (e.g. <= 10000)
          if (frac.d > 1 && frac.d <= 10000) {
            fractionValue = `${frac.n * frac.s}/${frac.d}`;
          }
        } catch (e) {
          // ignore fraction conversion errors
        }
      }

      let formatted = math.format(res, { precision: this.precision, notation: 'auto' });
      
      return { success: true, value: formatted, fractionValue };
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes('Domain Error')) {
        return { success: false, error: 'Domain Error' };
      }
      if (e.message && e.message.includes('Math Error')) {
        return { success: false, error: 'Math Error' };
      }
      return { success: false, error: "Syntax Error" };
    }
  }
}
