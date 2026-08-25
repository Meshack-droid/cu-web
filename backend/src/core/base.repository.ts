import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Column/filter keys ultimately come from user input (req.query for
// findAll's filters, req.body for create/update) and get interpolated
// directly into SQL as identifiers — they can't be parameterized the way
// values can. This whitelist is the only thing standing between "?foo=bar"
// and a crafted query-string key becoming part of the SQL statement, so
// every code path that builds `${key} = :${key}` must go through it first.
const SAFE_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function isSafeIdentifier(key: string): boolean {
  return SAFE_IDENTIFIER.test(key) && key.length <= 64;
}

/**
 * Generic repository over a single table. Concrete modules extend this for
 * simple CRUD needs and add bespoke query methods for anything more complex.
 * Repositories contain no business logic (Chapter 64).
 */
export class BaseRepository<T extends { id: string }> {
  constructor(
    protected readonly table: string,
    protected readonly softDelete: boolean = false
  ) {}

  async findAll(
    filters: Record<string, unknown> = {},
    { page = 1, pageSize = 20 }: PaginationParams = {}
  ): Promise<PaginatedResult<T>> {
    const whereClauses: string[] = [];
    const params: Record<string, unknown> = {};

    if (this.softDelete) whereClauses.push('deleted_at IS NULL');

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') continue;
      // Unrecognized/unsafe filter keys are silently ignored rather than
      // rejected outright — a stray or malicious query-string param
      // shouldn't break an otherwise-valid list request, it just won't
      // filter on that field.
      if (!isSafeIdentifier(key)) continue;
      whereClauses.push(`${key} = :${key}`);
      params[key] = value;
    }

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM ${this.table} ${where}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    const rows = await query<T[]>(
      `SELECT * FROM ${this.table} ${where} ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
      { ...params, limit: pageSize, offset }
    );

    return {
      rows,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findById(id: string): Promise<T> {
    const where = this.softDelete ? 'id = :id AND deleted_at IS NULL' : 'id = :id';
    const rows = await query<T[]>(`SELECT * FROM ${this.table} WHERE ${where} LIMIT 1`, { id });
    const record = rows[0];
    if (!record) throw new NotFoundError(this.table);
    return record;
  }

  async create(data: Partial<T>): Promise<T> {
    const id = (data.id as string) ?? uuidv4();
    const record = { ...data, id };
    const columns = Object.keys(record);

    // Unlike findAll's filters, an invalid column name here means the
    // write itself can't be trusted — reject the whole request rather
    // than silently dropping fields, which could persist incomplete data
    // without the caller realizing anything was skipped.
    const unsafe = columns.filter((c) => !isSafeIdentifier(c));
    if (unsafe.length > 0) {
      throw new ValidationError('Invalid field name(s) in request body', unsafe.map((c) => ({
        code: 'INVALID_FIELD',
        field: c,
        message: `"${c}" is not a valid field name`,
      })));
    }

    const placeholders = columns.map((c) => `:${c}`);
    await query(
      `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
      record as Record<string, unknown>
    );
    return this.findById(id);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const entries = Object.entries(data).filter(([k]) => k !== 'id');
    if (entries.length === 0) return this.findById(id);

    const unsafe = entries.filter(([k]) => !isSafeIdentifier(k));
    if (unsafe.length > 0) {
      throw new ValidationError(
        'Invalid field name(s) in request body',
        unsafe.map(([k]) => ({
          code: 'INVALID_FIELD',
          field: k,
          message: `"${k}" is not a valid field name`,
        }))
      );
    }

    const setClause = entries.map(([k]) => `${k} = :${k}`).join(', ');
    const params = Object.fromEntries(entries);

    await query(`UPDATE ${this.table} SET ${setClause} WHERE id = :id`, { ...params, id });
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    if (this.softDelete) {
      await query(`UPDATE ${this.table} SET deleted_at = NOW() WHERE id = :id`, { id });
    } else {
      await query(`DELETE FROM ${this.table} WHERE id = :id`, { id });
    }
  }
}
