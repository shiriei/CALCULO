import { describe, it, expect } from 'vitest';
import { validateEmail } from './authUtils';

describe('Auth Validation Utilities', () => {
  describe('validateEmail', () => {
    it('accepts valid email addresses', () => {
      expect(validateEmail('isha@gmail.com')).toBe(true);
      expect(validateEmail('user.name@example.co.in')).toBe(true);
      expect(validateEmail('test+alias@domain.org')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('chan')).toBe(false);
      expect(validateEmail('isha@')).toBe(false);
      expect(validateEmail('isha@gmail')).toBe(false);
      expect(validateEmail('@gmail.com')).toBe(false);
      expect(validateEmail('isha @gmail.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('rejects emails with only whitespace', () => {
      expect(validateEmail('   ')).toBe(false);
    });
  });
});
