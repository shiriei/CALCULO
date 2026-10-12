import { describe, it, expect } from 'vitest';
import { GraphingEngine } from './graphingEngine';

describe('GraphingEngine', () => {
  const engine = new GraphingEngine();

  it('evaluates basic expressions', () => {
    const res = engine.evaluateSingle('x^2', 3, 'rad');
    expect(res.value).toBe(9);
    expect(res.error).toBeUndefined();
  });

  describe('Trigonometric evaluations', () => {
    it('evaluates sin correctly in radian mode', () => {
      expect(engine.evaluateSingle('sin(x)', 0, 'rad').value).toBeCloseTo(0);
      expect(engine.evaluateSingle('sin(x)', Math.PI / 2, 'rad').value).toBeCloseTo(1);
      expect(engine.evaluateSingle('sin(x)', Math.PI, 'rad').value).toBeCloseTo(0);
      expect(engine.evaluateSingle('sin(x)', 3 * Math.PI / 2, 'rad').value).toBeCloseTo(-1);
    });

    it('evaluates sin correctly in degree mode', () => {
      expect(engine.evaluateSingle('sin(x)', 0, 'deg').value).toBeCloseTo(0);
      expect(engine.evaluateSingle('sin(x)', 30, 'deg').value).toBeCloseTo(0.5);
      expect(engine.evaluateSingle('sin(x)', 90, 'deg').value).toBeCloseTo(1);
      expect(engine.evaluateSingle('sin(x)', 180, 'deg').value).toBeCloseTo(0);
    });

    it('preserves x^2 and 2*x+3 correctly in both modes', () => {
      expect(engine.evaluateSingle('x^2', 3, 'deg').value).toBeCloseTo(9);
      expect(engine.evaluateSingle('x^2', 3, 'rad').value).toBeCloseTo(9);
      expect(engine.evaluateSingle('2*x+3', 4, 'deg').value).toBeCloseTo(11);
      expect(engine.evaluateSingle('2*x+3', 4, 'rad').value).toBeCloseTo(11);
    });
  });

  it('handles division by zero and infinity gracefully', () => {
    const res = engine.evaluateSingle('1/x', 0, 'rad');
    expect(res.error).toContain('Undefined or Infinity');
    expect(res.value).toBeUndefined();
  });

  it('rejects complex results from square roots of negative numbers', () => {
    const res = engine.evaluateSingle('sqrt(x)', -4, 'rad');
    expect(res.error).toBeDefined();
    expect(res.value).toBeUndefined();
  });

  it('catches syntax errors', () => {
    const res = engine.evaluateSingle('2 * x +', 3, 'rad');
    expect(res.error).toBeDefined();
  });

  describe('sampleFunction', () => {
    it('generates segments for a continuous function', () => {
      const func = { id: '1', expression: 'x^2', color: 'red' };
      const res = engine.sampleFunction(func, 0, 10, 10, 'rad'); // 11 points
      expect(res.error).toBeUndefined();
      expect(res.segments.length).toBe(1); // One continuous segment
      expect(res.segments[0].length).toBe(11);
      expect(res.segments[0][0].y).toBe(0);
      expect(res.segments[0][10].y).toBe(100);
    });

    it('breaks segments on asymptotes (e.g., 1/x)', () => {
      const func = { id: '1', expression: '1/x', color: 'red' };
      // From -1 to 1, crossing 0 where it shoots to infinity
      const res = engine.sampleFunction(func, -1, 1, 20, 'rad'); 
      expect(res.error).toBeUndefined();
      // Should break into at least 2 segments
      expect(res.segments.length).toBeGreaterThan(1);
    });

    it('handles negative domains for sqrt', () => {
      const func = { id: '1', expression: 'sqrt(x)', color: 'red' };
      // From -5 to 5. -5 to <0 should be empty. >= 0 should have points.
      const res = engine.sampleFunction(func, -5, 5, 20, 'rad');
      expect(res.segments.length).toBe(1); // Only the positive side gets a segment
      expect(res.segments[0][0].x).toBeGreaterThanOrEqual(0);
    });

    it('samples trigonometric functions correctly in radian and degree modes', () => {
      const func = { id: '1', expression: 'sin(x)', color: 'red' };
      
      // Radian mode: 0 to pi (resolution 2 -> x = 0, pi/2, pi)
      const resRad = engine.sampleFunction(func, 0, Math.PI, 2, 'rad');
      expect(resRad.error).toBeUndefined();
      expect(resRad.segments.length).toBe(1);
      expect(resRad.segments[0][0].y).toBeCloseTo(0);
      expect(resRad.segments[0][1].y).toBeCloseTo(1);
      expect(resRad.segments[0][2].y).toBeCloseTo(0);

      // Degree mode: 0 to 180 (resolution 2 -> x = 0, 90, 180)
      const resDeg = engine.sampleFunction(func, 0, 180, 2, 'deg');
      expect(resDeg.error).toBeUndefined();
      expect(resDeg.segments.length).toBe(1);
      expect(resDeg.segments[0][0].y).toBeCloseTo(0);
      expect(resDeg.segments[0][1].y).toBeCloseTo(1);
      expect(resDeg.segments[0][2].y).toBeCloseTo(0);

      // Degree mode: wide range -360 to 360
      const resDegWide = engine.sampleFunction(func, -360, 360, 8, 'deg');
      expect(resDegWide.error).toBeUndefined();
      expect(resDegWide.segments.length).toBe(1);
      for (const pt of resDegWide.segments[0]) {
        expect(pt.y).toBeGreaterThanOrEqual(-1 - 1e-6);
        expect(pt.y).toBeLessThanOrEqual(1 + 1e-6);
      }
    });
  });

  describe('findRoots and findIntersections', () => {
    it('finds approximate roots for x^2-4', () => {
      const func = { id: 'f1', expression: 'x^2-4', color: 'red' };
      const roots = engine.findRoots(func, -5, 5, 'rad');
      expect(roots.length).toBeGreaterThanOrEqual(2);
      expect(roots.some(r => Math.abs(r.x - 2) < 0.1)).toBe(true);
      expect(roots.some(r => Math.abs(r.x + 2) < 0.1)).toBe(true);
    });

    it('returns empty for x^2+1', () => {
      const func = { id: 'f1', expression: 'x^2+1', color: 'red' };
      const roots = engine.findRoots(func, -5, 5, 'rad');
      expect(roots.length).toBe(0);
    });

    it('detects tangent roots for x^2', () => {
      const func = { id: 'f1', expression: 'x^2', color: 'red' };
      const roots = engine.findRoots(func, -5, 5, 'rad');
      expect(roots.length).toBeGreaterThanOrEqual(1);
      expect(roots.some(r => Math.abs(r.x) < 0.1)).toBe(true);
    });

    it('ignores asymptotes for 1/x', () => {
      const func = { id: 'f1', expression: '1/x', color: 'red' };
      const roots = engine.findRoots(func, -5, 5, 'rad');
      expect(roots.length).toBe(0);
    });

    it('handles restricted domains like sqrt(x)', () => {
      const func = { id: 'f1', expression: 'sqrt(x)', color: 'red' };
      const roots = engine.findRoots(func, -5, 5, 'rad');
      // depending on resolution and tangent detection, it might find ~0 or nothing.
      // the key is it shouldn't crash or find false roots in negative x.
      expect(roots.some(r => r.x < -0.1)).toBe(false);
    });

    it('finds intersections for x^2 and 2*x+3', () => {
      const f1 = { id: 'f1', expression: 'x^2', color: 'red' };
      const f2 = { id: 'f2', expression: '2*x+3', color: 'blue' };
      const ints = engine.findIntersections(f1, f2, -5, 5, 'rad');
      expect(ints.length).toBeGreaterThanOrEqual(2);
      expect(ints.some(i => Math.abs(i.x - 3) < 0.1 && Math.abs(i.y - 9) < 0.1)).toBe(true);
      expect(ints.some(i => Math.abs(i.x + 1) < 0.1 && Math.abs(i.y - 1) < 0.1)).toBe(true);
    });
  });

  describe('Cubic and linear graph evaluation and sampling', () => {
    it('evaluates and samples 3x^3 as a continuous cubic curve', () => {
      expect(engine.evaluateSingle('3x^3', 0, 'rad').value).toBeCloseTo(0);
      expect(engine.evaluateSingle('3x^3', 2, 'rad').value).toBeCloseTo(24);
      expect(engine.evaluateSingle('3x^3', -2, 'rad').value).toBeCloseTo(-24);

      const plotted = engine.sampleFunction({ id: 'c1', expression: '3x^3', color: 'red' }, -2, 2, 50, 'rad', -30, 30);
      expect(plotted.error).toBeUndefined();
      expect(plotted.segments.length).toBe(1); // Exactly 1 continuous branch
      expect(plotted.segments[0][0].y).toBeCloseTo(-24);
      expect(plotted.segments[0][plotted.segments[0].length - 1].y).toBeCloseTo(24);
    });

    it('evaluates and samples y = 8x + 3 with equation prefix', () => {
      expect(engine.evaluateSingle('y = 8x + 3', 0, 'rad').value).toBeCloseTo(3);
      expect(engine.evaluateSingle('y = 8x + 3', 2, 'rad').value).toBeCloseTo(19);

      const plotted = engine.sampleFunction({ id: 'l1', expression: 'y = 8x + 3', color: 'blue' }, -5, 5, 20, 'rad', -40, 45);
      expect(plotted.error).toBeUndefined();
      expect(plotted.segments.length).toBe(1);
      expect(plotted.segments[0][0].y).toBeCloseTo(-37);
      expect(plotted.segments[0][plotted.segments[0].length - 1].y).toBeCloseTo(43);
    });
  });

  describe('Reciprocal trigonometric aliases and degree/radian modes', () => {
    it('evaluates csc and cosec identically in radian mode', () => {
      const cscVal = engine.evaluateSingle('csc(x)', Math.PI / 2, 'rad').value;
      const cosecVal = engine.evaluateSingle('cosec(x)', Math.PI / 2, 'rad').value;
      expect(cscVal).toBeCloseTo(1);
      expect(cosecVal).toBeCloseTo(1);

      expect(engine.evaluateSingle('csc(x)', Math.PI / 6, 'rad').value).toBeCloseTo(2);
      expect(engine.evaluateSingle('cosec(x)', Math.PI / 6, 'rad').value).toBeCloseTo(2);
    });

    it('evaluates csc and cosec identically in degree mode', () => {
      expect(engine.evaluateSingle('csc(x)', 90, 'deg').value).toBeCloseTo(1);
      expect(engine.evaluateSingle('cosec(x)', 90, 'deg').value).toBeCloseTo(1);
      expect(engine.evaluateSingle('csc(x)', 30, 'deg').value).toBeCloseTo(2);
      expect(engine.evaluateSingle('cosec(x)', 30, 'deg').value).toBeCloseTo(2);
    });

    it('evaluates sec and cot in degree mode', () => {
      expect(engine.evaluateSingle('sec(x)', 0, 'deg').value).toBeCloseTo(1);
      expect(engine.evaluateSingle('sec(x)', 60, 'deg').value).toBeCloseTo(2);
      expect(engine.evaluateSingle('cot(x)', 45, 'deg').value).toBeCloseTo(1);
    });

    it('evaluates cos and tan in both modes', () => {
      expect(engine.evaluateSingle('cos(x)', 0, 'rad').value).toBeCloseTo(1);
      expect(engine.evaluateSingle('cos(x)', Math.PI, 'rad').value).toBeCloseTo(-1);
      expect(engine.evaluateSingle('tan(x)', Math.PI / 4, 'rad').value).toBeCloseTo(1);

      expect(engine.evaluateSingle('cos(x)', 0, 'deg').value).toBeCloseTo(1);
      expect(engine.evaluateSingle('cos(x)', 180, 'deg').value).toBeCloseTo(-1);
      expect(engine.evaluateSingle('tan(x)', 45, 'deg').value).toBeCloseTo(1);
    });
  });

  describe('Singularities and path segmentation', () => {
    it('breaks cosec(x) into separate branches across singularity at x = 0', () => {
      const plotted = engine.sampleFunction(
        { id: 'csc1', expression: 'cosec(x)', color: 'green' },
        -3, 3, 100, 'rad', -10, 10
      );
      expect(plotted.error).toBeUndefined();
      expect(plotted.segments.length).toBeGreaterThanOrEqual(2);
      
      // Ensure no segment spans across x = 0 connecting negative and positive infinity
      for (const seg of plotted.segments) {
        const hasNegativeX = seg.some(pt => pt.x < -0.05);
        const hasPositiveX = seg.some(pt => pt.x > 0.05);
        expect(hasNegativeX && hasPositiveX).toBe(false);
      }
    });

    it('breaks csc(x) in degree mode across x = 0 and x = 180', () => {
      const plotted = engine.sampleFunction(
        { id: 'csc2', expression: 'csc(x)', color: 'purple' },
        -90, 90, 100, 'deg', -10, 10
      );
      expect(plotted.error).toBeUndefined();
      expect(plotted.segments.length).toBeGreaterThanOrEqual(2);
    });

    it('breaks tan(x) into separate branches at asymptotes', () => {
      const plotted = engine.sampleFunction(
        { id: 'tan1', expression: 'tan(x)', color: 'orange' },
        -3, 3, 150, 'rad', -10, 10
      );
      expect(plotted.error).toBeUndefined();
      expect(plotted.segments.length).toBeGreaterThanOrEqual(3);
    });
  });
});

