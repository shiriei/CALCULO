import { describe, it, expect } from 'vitest';
import { formatPiLabel, getDefaultRange, convertPixelDeltaToDataDelta } from './graphingUtils';

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
});
