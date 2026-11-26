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

import {
  uuidSchema,
  idParamSchema,
  createSortSchema,
  paginatedQuerySchema,
  sectionNameSchema,
  normalizeSectionName,
} from './index.js';

describe('@fsd-sdg4/validation — sectionNameSchema & Section Input Rules', () => {
  it('accepts single capital letters A, B, C', () => {
    const resA = sectionNameSchema.safeParse('A');
    expect(resA.success).toBe(true);
    if (resA.success) expect(resA.data).toBe('A');

    const resB = sectionNameSchema.safeParse('B');
    expect(resB.success).toBe(true);
    if (resB.success) expect(resB.data).toBe('B');
  });

  it('auto-uppercases single lowercase alphabet character: "a" -> "A"', () => {
    const res = sectionNameSchema.safeParse('a');
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toBe('A');
  });

  it('normalizes redundant "Section " and "sec " prefixes: "Section A" -> "A"', () => {
    const res1 = sectionNameSchema.safeParse('Section A');
    expect(res1.success).toBe(true);
    if (res1.success) expect(res1.data).toBe('A');

    const res2 = sectionNameSchema.safeParse('section b');
    expect(res2.success).toBe(true);
    if (res2.success) expect(res2.data).toBe('B');

    const res3 = sectionNameSchema.safeParse('Sec-C');
    expect(res3.success).toBe(true);
    if (res3.success) expect(res3.data).toBe('C');
  });

  it('accepts descriptive section names (e.g. Rose, Alpha, 8-A)', () => {
    const resRose = sectionNameSchema.safeParse('Rose');
    expect(resRose.success).toBe(true);
    if (resRose.success) expect(resRose.data).toBe('Rose');

    const resAlpha = sectionNameSchema.safeParse('Alpha');
    expect(resAlpha.success).toBe(true);
    if (resAlpha.success) expect(resAlpha.data).toBe('Alpha');

    const res8A = sectionNameSchema.safeParse('8-A');
    expect(res8A.success).toBe(true);
    if (res8A.success) expect(res8A.data).toBe('8-A');
  });

  it('rejects single numbers or special characters for single-character sections', () => {
    expect(sectionNameSchema.safeParse('1').success).toBe(false);
    expect(sectionNameSchema.safeParse('$').success).toBe(false);
  });

  it('verifies normalizeSectionName helper directly', () => {
    expect(normalizeSectionName('Section A')).toBe('A');
    expect(normalizeSectionName('section b')).toBe('B');
    expect(normalizeSectionName('c')).toBe('C');
    expect(normalizeSectionName('Rose')).toBe('Rose');
    expect(normalizeSectionName('Section-Rose')).toBe('Rose');
    expect(normalizeSectionName('8-A')).toBe('8-A');
  });
});

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

