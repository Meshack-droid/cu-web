import { describe, expect, it } from 'vitest';
import { passwordPolicy } from '../dto/auth.dto';

describe('passwordPolicy', () => {
  it('accepts a password meeting every rule', () => {
    expect(passwordPolicy.safeParse('Str0ng!Passw0rd').success).toBe(true);
  });

  it('rejects passwords under 10 characters', () => {
    const result = passwordPolicy.safeParse('Sh0rt!Aa');
    expect(result.success).toBe(false);
  });

  it('rejects passwords missing an uppercase letter', () => {
    const result = passwordPolicy.safeParse('lowercase1!');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('uppercase'))).toBe(true);
    }
  });

  it('rejects passwords missing a lowercase letter', () => {
    const result = passwordPolicy.safeParse('UPPERCASE1!');
    expect(result.success).toBe(false);
  });

  it('rejects passwords missing a number', () => {
    const result = passwordPolicy.safeParse('NoNumbersHere!');
    expect(result.success).toBe(false);
  });

  it('rejects passwords missing a symbol', () => {
    const result = passwordPolicy.safeParse('NoSymbolsHere1');
    expect(result.success).toBe(false);
  });

  it('rejects passwords over 128 characters', () => {
    const tooLong = 'Aa1!'.repeat(40); // 160 chars
    expect(passwordPolicy.safeParse(tooLong).success).toBe(false);
  });

  // Regression test: this is the exact case that failed live during manual
  // testing earlier — a plausible-looking password that's actually missing
  // two required character classes.
  it('rejects "password123" style passwords used in early manual testing', () => {
    expect(passwordPolicy.safeParse('password123').success).toBe(false);
  });
});
