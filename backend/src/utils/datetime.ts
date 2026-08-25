/**
 * MySQL's DATETIME columns reject JavaScript's native ISO 8601 format
 * (`2026-08-07T02:12:40.440Z` — with a literal "T" and "Z") with
 * ER_TRUNCATED_WRONG_VALUE. Use this instead of `new Date().toISOString()`
 * anywhere a timestamp is being written directly into a query as a string.
 *
 * Note: this strips to UTC and drops the timezone offset, matching how the
 * rest of the schema stores DATETIME (not TIMESTAMP) values — the app
 * treats everything as UTC by convention (see config/database.ts's
 * `dateStrings: true`).
 */
export function toMySQLDateTime(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}
