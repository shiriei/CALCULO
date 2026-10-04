import { describe, it, expect, beforeEach } from 'vitest';
import { CalculatorEngine } from './calculator';

describe('CalculatorEngine', () => {
  let engine: CalculatorEngine;

  beforeEach(() => {
    engine = new CalculatorEngine();
  });

  it('evaluates basic arithmetic correctly', () => {
    expect(engine.evaluate('2 + 3 * 4')).toMatchObject({ success: true, value: '14' });
    expect(engine.evaluate('(2 + 3) * 4')).toMatchObject({ success: true, value: '20' });
    expect(engine.evaluate('10 / 2 - 1')).toMatchObject({ success: true, value: '4' });
  });

  it('handles negative numbers and decimals', () => {
    expect(engine.evaluate('-5 + 3')).toMatchObject({ success: true, value: '-2' });
    expect(engine.evaluate('2.5 * 4.2')).toMatchObject({ success: true, value: '10.5' });
  });

  it('handles floating point precision seamlessly', () => {
    expect(engine.evaluate('0.1 + 0.2')).toMatchObject({ success: true, value: '0.3' });
  });

  it('evaluates powers, square roots and factorials', () => {
    expect(engine.evaluate('2 ^ 3')).toMatchObject({ success: true, value: '8' });
    expect(engine.evaluate('sqrt(16)')).toMatchObject({ success: true, value: '4' });
    expect(engine.evaluate('5!')).toMatchObject({ success: true, value: '120' });
  });

  it('evaluates logarithms and exponentials', () => {
    expect(engine.evaluate('log(100, 10)')).toMatchObject({ success: true, value: '2' });
    expect(engine.evaluate('exp(0)')).toMatchObject({ success: true, value: '1' });
  });

  it('evaluates trigonometric functions in degree mode', () => {
    engine.setAngleMode('deg');
    expect(engine.evaluate('sin(30)')).toMatchObject({ success: true, value: '0.5' });
    expect(engine.evaluate('cos(60)')).toMatchObject({ success: true, value: '0.5' });
    expect(engine.evaluate('asin(0.5)')).toMatchObject({ success: true, value: '30' });
    expect(engine.evaluate('tan(90)')).toMatchObject({ success: false, error: 'Domain Error' });
  });

  it('evaluates trigonometric functions in radian mode', () => {
    engine.setAngleMode('rad');
    expect(engine.evaluate('sin(pi / 2)')).toMatchObject({ success: true, value: '1' });
    expect(engine.evaluate('cos(pi)')).toMatchObject({ success: true, value: '-1' });
    expect(engine.evaluate('asin(1)')).toMatchObject({ success: true, value: '1.5707963267949' });
    expect(engine.evaluate('asin(2)')).toMatchObject({ success: false, error: 'Domain Error' });
  });

  it('handles division by zero', () => {
    expect(engine.evaluate('5 / 0')).toMatchObject({ success: false, error: 'Math Error' });
    expect(engine.evaluate('reciprocal(0)')).toMatchObject({ success: false, error: 'Math Error' });
  });

  it('handles empty input', () => {
    expect(engine.evaluate('')).toMatchObject({ success: true, value: '' });
    expect(engine.evaluate('   ')).toMatchObject({ success: true, value: '' });
  });

  // NEW TESTS
  it('evaluates modulo and remainder', () => {
    expect(engine.evaluate('mod(-5, 3)')).toMatchObject({ success: true, value: '1' });
    expect(engine.evaluate('rem(-5, 3)')).toMatchObject({ success: true, value: '-2' });
  });

  it('evaluates floor, ceil, round, sign, absolute value', () => {
    expect(engine.evaluate('floor(2.8)')).toMatchObject({ success: true, value: '2' });
    expect(engine.evaluate('ceil(2.1)')).toMatchObject({ success: true, value: '3' });
    expect(engine.evaluate('round(2.5)')).toMatchObject({ success: true, value: '3' });
    expect(engine.evaluate('sign(-42)')).toMatchObject({ success: true, value: '-1' });
    expect(engine.evaluate('abs(-42)')).toMatchObject({ success: true, value: '42' });
  });

  it('evaluates hyperbolic functions', () => {
    expect(engine.evaluate('sinh(0)')).toMatchObject({ success: true, value: '0' });
    expect(engine.evaluate('cosh(0)')).toMatchObject({ success: true, value: '1' });
    expect(engine.evaluate('tanh(0)')).toMatchObject({ success: true, value: '0' });
  });

  it('evaluates combinatorics', () => {
    expect(engine.evaluate('permutations(5, 2)')).toMatchObject({ success: true, value: '20' });
    expect(engine.evaluate('combinations(5, 2)')).toMatchObject({ success: true, value: '10' });
    expect(engine.evaluate('combinations(2000, 2)')).toMatchObject({ success: false, error: 'Domain Error' });
  });

  it('evaluates gcd and lcm', () => {
    expect(engine.evaluate('gcd(8, 12)')).toMatchObject({ success: true, value: '4' });
    expect(engine.evaluate('lcm(4, 6)')).toMatchObject({ success: true, value: '12' });
  });

  it('evaluates prime factorization', () => {
    expect(engine.evaluate('factorize(12)')).toMatchObject({ success: true, value: '2 * 2 * 3' });
    expect(engine.evaluate('factorize(1000000001)')).toMatchObject({ success: false, error: 'Domain Error' });
  });

  it('provides fraction representation when appropriate', () => {
    const result = engine.evaluate('0.5 + 0.25');
    expect(result.success).toBe(true);
    expect(result.value).toBe('0.75');
    expect(result.fractionValue).toBe('3/4');

    const result2 = engine.evaluate('1 / 3');
    expect(result2.success).toBe(true);
    expect(result2.fractionValue).toBe('1/3');
  });

  it('evaluates scientific notation correctly', () => {
    expect(engine.evaluate('1.2e3 + 300')).toMatchObject({ success: true, value: '1500' });
  });
});
