import { describe, it, expect } from 'vitest';
import { emailSchema, nonEmptyString, paginationSchema, isoDateString } from './index.js';

describe('@fsd-sdg4/validation — emailSchema', () => {
  it('accepts a valid institutional email', () => {
    const result = emailSchema.safeParse('teacher@apexhigh.edu');
    expect(result.success).toBe(true);
  });

  it('rejects a malformed email string', () => {
    const result = emailSchema.safeParse('not-an-email');
    expect(result.success).toBe(false);
  });

  it('normalises email to lowercase', () => {
    const result = emailSchema.safeParse('TEACHER@School.edu');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('teacher@school.edu');
    }
  });
});

describe('@fsd-sdg4/validation — nonEmptyString', () => {
  it('accepts a non-empty trimmed string', () => {
    const schema = nonEmptyString('Title');
    expect(schema.safeParse('Fractions Problem Set').success).toBe(true);
  });

  it('rejects an empty string', () => {
    const schema = nonEmptyString('Title');
    expect(schema.safeParse('').success).toBe(false);
  });

  it('rejects a whitespace-only string after trimming', () => {
    const schema = nonEmptyString('Title');
    expect(schema.safeParse('   ').success).toBe(false);
  });
});

describe('@fsd-sdg4/validation — paginationSchema', () => {
  it('applies default values when no input provided', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(25);
    }
  });

  it('rejects limit greater than 100', () => {
    const result = paginationSchema.safeParse({ page: 1, limit: 500 });
    expect(result.success).toBe(false);
  });
});

describe('@fsd-sdg4/validation — isoDateString & Date Regression Suite', () => {
  it('1. accepts valid admission date: 2026-06-01', () => {
    const res = isoDateString.safeParse('2026-06-01');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe('2026-06-01');
    }
  });

  it('2. accepts valid date of birth: 2010-04-15', () => {
    const res = isoDateString.safeParse('2010-04-15');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe('2010-04-15');
    }
  });

  it('3. rejects invalid calendar date: 2026-02-30', () => {
    const res = isoDateString.safeParse('2026-02-30');
    expect(res.success).toBe(false);
  });

  it('4. rejects unsupported date format: 01-06-2026', () => {
    const res = isoDateString.safeParse('01-06-2026');
    expect(res.success).toBe(false);
  });

  it('5. handles empty optional date field', () => {
    const emptyOptional = isoDateString.optional().safeParse(undefined);
    expect(emptyOptional.success).toBe(true);
  });

  it('6. trims surrounding whitespace around valid date values: "  2026-06-01  "', () => {
    const res = isoDateString.safeParse('  2026-06-01  ');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe('2026-06-01');
    }
  });
});

import { uuidSchema, idParamSchema, createSortSchema, paginatedQuerySchema } from './index.js';

describe('@fsd-sdg4/validation — Phase 6 identifiers, sorting & query schemas', () => {
  it('validates UUIDs and rejects malformed identifiers', () => {
    expect(uuidSchema.safeParse('10000000-0000-4000-8000-000000000001').success).toBe(true);
    expect(idParamSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
  });

  it('enforces sort field allowlist via createSortSchema', () => {
    const sortSchema = createSortSchema(['createdAt', 'name'] as const);
    expect(sortSchema.parse({})).toEqual({ sortBy: 'createdAt', sortOrder: 'desc' });
    expect(sortSchema.safeParse({ sortBy: 'passwordHash' }).success).toBe(false);
  });

  it('parses paginatedQuerySchema with optional search and defaults', () => {
    const parsed = paginatedQuerySchema.parse({ page: '2', limit: '10', search: '  math  ' });
    expect(parsed).toEqual({ page: 2, limit: 10, search: 'math', sortOrder: 'desc' });
  });
});
