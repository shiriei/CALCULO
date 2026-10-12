import { describe, it, expect } from 'vitest';
import { formatPiLabel, getDefaultRange, convertPixelDeltaToDataDelta, getTickValues, mathToScreen, screenToMath } from './graphingUtils';

describe('graphingUtils', () => {
  describe('formatPiLabel', () => {
    it('formats 0', () => {
      expect(formatPiLabel(0)).toBe('0');
      expect(formatPiLabel(1e-10)).toBe('0'); // floating point tolerance
    });
    
    it('formats exact pi multiples', () => {
      expect(formatPiLabel(Math.PI)).toBe('π');
      expect(formatPiLabel(-Math.PI)).toBe('-π');
      expect(formatPiLabel(2 * Math.PI)).toBe('2π');
      expect(formatPiLabel(-3 * Math.PI)).toBe('-3π');
    });

    it('formats half pi multiples', () => {
      expect(formatPiLabel(Math.PI / 2)).toBe('π/2');
      expect(formatPiLabel(-Math.PI / 2)).toBe('-π/2');
      expect(formatPiLabel(3 * Math.PI / 2)).toBe('3π/2');
      expect(formatPiLabel(-5 * Math.PI / 2)).toBe('-5π/2');
    });

    it('falls back for non-standard fractions', () => {
      expect(formatPiLabel(Math.PI / 4)).toBe((Math.PI / 4).toFixed(2));
    });
  });

  describe('getDefaultRange', () => {
    it('returns correct range for deg', () => {
      expect(getDefaultRange('deg')).toEqual({ min: -360, max: 360 });
    });
    it('returns correct range for rad', () => {
      expect(getDefaultRange('rad')).toEqual({ min: -10, max: 10 });
    });
    it('returns correct range for pi', () => {
      expect(getDefaultRange('pi')).toEqual({ min: -2 * Math.PI, max: 2 * Math.PI });
    });
  });

  describe('convertPixelDeltaToDataDelta', () => {
    it('calculates correct coordinate deltas', () => {
      // 100px move on a 1000px rect with a 20 unit range -> 2 units
      const { dXData, dYData } = convertPixelDeltaToDataDelta(100, -50, 1000, 500, 20, 10);
      expect(dXData).toBe(2);
      expect(dYData).toBe(-1);
    });
  });

  describe('mathToScreen and screenToMath coordinate conversions', () => {
    const bounds = { xMin: -10, xMax: 10, yMin: -5, yMax: 15 };
    const width = 800;
    const height = 400;

    it('maps corners and origin correctly from math to screen', () => {
      // Top-left: (xMin, yMax) -> (0, 0) in screen
      const topLeft = mathToScreen(bounds.xMin, bounds.yMax, bounds, width, height);
      expect(topLeft.xPx).toBeCloseTo(0);
      expect(topLeft.yPx).toBeCloseTo(0);

      // Bottom-right: (xMax, yMin) -> (width, height) in screen
      const bottomRight = mathToScreen(bounds.xMax, bounds.yMin, bounds, width, height);
      expect(bottomRight.xPx).toBeCloseTo(width);
      expect(bottomRight.yPx).toBeCloseTo(height);

      // Center: (0, 5) -> (width/2, height/2) in screen
      const center = mathToScreen(0, 5, bounds, width, height);
      expect(center.xPx).toBeCloseTo(400);
      expect(center.yPx).toBeCloseTo(200);
    });

    it('inverts screen to math coordinates accurately', () => {
      const origX = 2.5;
      const origY = 7.5;
      const screen = mathToScreen(origX, origY, bounds, width, height);
      const math = screenToMath(screen.xPx, screen.yPx, bounds, width, height);
      expect(math.x).toBeCloseTo(origX);
      expect(math.y).toBeCloseTo(origY);
    });
  });

  describe('getTickValues nice numbers', () => {
    it('produces sensible decimal ticks without exploding on range 9.9', () => {
      const ticks = getTickValues(-4.9, 5.0, 'rad');
      expect(ticks.length).toBeGreaterThanOrEqual(4);
      expect(ticks.length).toBeLessThanOrEqual(15);
      // step should be 1
      expect(ticks).toContain(0);
      expect(ticks).toContain(1);
    });

    it('produces clean degree ticks for wide ranges', () => {
      const ticks = getTickValues(-360, 360, 'deg');
      expect(ticks.length).toBeGreaterThanOrEqual(5);
      expect(ticks.length).toBeLessThanOrEqual(15);
      expect(ticks).toContain(0);
      expect(ticks).toContain(90);
      expect(ticks).toContain(-90);
      expect(ticks).toContain(180);
    });
  });
});

