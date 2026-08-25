import { describe, expect, it } from 'vitest';
import { toMySQLDateTime } from './datetime';

describe('toMySQLDateTime', () => {
  it('produces a MySQL-compatible DATETIME string, not JS ISO format', () => {
    const date = new Date('2026-08-07T02:12:40.440Z');
    const result = toMySQLDateTime(date);
    expect(result).toBe('2026-08-07 02:12:40');
  });

  // Regression test: this is the exact bug caught during live browser
  // testing of the expense approval flow — MySQL rejected
  // `new Date().toISOString()` (`...T...Z` format) with
  // ER_TRUNCATED_WRONG_VALUE on a DATETIME column.
  it('never contains a literal "T" or "Z" the way toISOString() does', () => {
    const result = toMySQLDateTime(new Date());
    expect(result).not.toMatch(/[TZ]/);
  });

  it('defaults to the current time when no argument is given', () => {
    const before = Date.now();
    const result = toMySQLDateTime();
    const parsed = new Date(result.replace(' ', 'T') + 'Z').getTime();
    expect(parsed).toBeGreaterThanOrEqual(before - 1000);
    expect(parsed).toBeLessThanOrEqual(Date.now() + 1000);
  });
});
