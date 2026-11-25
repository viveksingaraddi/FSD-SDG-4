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

describe('@fsd-sdg4/validation — isoDateString', () => {
  it('accepts a valid ISO date string', () => {
    expect(isoDateString.safeParse('2026-11-05').success).toBe(true);
  });

  it('rejects a non-ISO date string', () => {
    expect(isoDateString.safeParse('Nov 5 2026').success).toBe(false);
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

import {
  parentStudentParamsSchema,
  parentActionParamsSchema,
  attendanceMonthQuerySchema,
  updateSupportActionStatusSchema,
  submitAbsenceNoteSchema,
} from './index.js';

describe('@fsd-sdg4/validation — Parent Portal Schemas (Phase 14 / Option A)', () => {
  const validUuid1 = '10000000-0000-4000-8000-000000000001';
  const validUuid2 = '20000000-0000-4000-8000-000000000002';

  it('validates parentStudentParamsSchema', () => {
    expect(parentStudentParamsSchema.safeParse({ studentId: validUuid1 }).success).toBe(true);
    expect(parentStudentParamsSchema.safeParse({ studentId: 'invalid-uuid' }).success).toBe(false);
  });

  it('validates parentActionParamsSchema', () => {
    expect(
      parentActionParamsSchema.safeParse({
        studentId: validUuid1,
        actionId: validUuid2,
      }).success,
    ).toBe(true);
    expect(
      parentActionParamsSchema.safeParse({
        studentId: validUuid1,
        actionId: 'invalid-uuid',
      }).success,
    ).toBe(false);
  });

  it('validates attendanceMonthQuerySchema', () => {
    expect(attendanceMonthQuerySchema.safeParse({ month: '2026-11' }).success).toBe(true);
    expect(attendanceMonthQuerySchema.safeParse({}).success).toBe(true);
    expect(attendanceMonthQuerySchema.safeParse({ month: '2026-1' }).success).toBe(false);
    expect(attendanceMonthQuerySchema.safeParse({ month: 'Nov-2026' }).success).toBe(false);
  });

  it('validates updateSupportActionStatusSchema', () => {
    expect(updateSupportActionStatusSchema.safeParse({ status: 'COMPLETED' }).success).toBe(true);
    expect(updateSupportActionStatusSchema.safeParse({ status: 'PENDING' }).success).toBe(true);
    expect(updateSupportActionStatusSchema.safeParse({ status: 'CANCELLED' }).success).toBe(false);
  });

  it('validates submitAbsenceNoteSchema', () => {
    expect(
      submitAbsenceNoteSchema.safeParse({
        attendanceRecordId: validUuid1,
        reason: 'Student had a medical appointment with documentation.',
      }).success,
    ).toBe(true);
    expect(
      submitAbsenceNoteSchema.safeParse({
        attendanceRecordId: validUuid1,
        reason: '',
      }).success,
    ).toBe(false);
    expect(
      submitAbsenceNoteSchema.safeParse({
        attendanceRecordId: 'bad-id',
        reason: 'Valid reason',
      }).success,
    ).toBe(false);
  });
});

