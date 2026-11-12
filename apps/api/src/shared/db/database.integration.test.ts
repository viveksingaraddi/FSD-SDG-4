import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDatabase } from '../../../prisma/seed.js';

const TEST_DB_URL =
  process.env['DATABASE_URL'] ??
  'postgresql://viveksantoshkumarsingaraddi@localhost:5432/fsd_sdg4_test?schema=public';

const prisma = new PrismaClient({
  datasources: {
    db: { url: TEST_DB_URL },
  },
});

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      audit_logs,
      support_reviews,
      support_plan_actions,
      support_flags,
      support_plans,
      progress_snapshots,
      feedbacks,
      assessment_results,
      assessments,
      assignment_submissions,
      assignments,
      learning_resources,
      attendance_records,
      guardian_relationships,
      enrollments,
      student_profiles,
      teacher_profiles,
      course_teachers,
      course_offerings,
      subjects,
      sections,
      classes,
      academic_years,
      sessions,
      users,
      schools
    CASCADE;
  `);
}

describe('Phase 5 PostgreSQL & Prisma Integration Suite', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await resetDatabase();
    await seedDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. verifies database connectivity', async () => {
    const result = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`;
    expect(result[0]?.ok).toBe(1);
  });

  it('2. verifies migration reproducibility via _prisma_migrations', async () => {
    const migrations = await prisma.$queryRaw<
      Array<{ migration_name: string; finished_at: Date | null }>
    >`SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at ASC`;

    expect(migrations.length).toBeGreaterThanOrEqual(1);
    expect(migrations[0]?.migration_name).toContain('init');
    expect(migrations.every((m) => m.finished_at !== null)).toBe(true);
  });

  it('3. enforces primary key integrity', async () => {
    await expect(
      prisma.school.create({
        data: {
          id: '10000000-0000-4000-8000-000000000001',
          name: 'Duplicate PK School',
          code: 'SCH-DUP-PK',
          subdomain: 'dup-pk',
          contactEmail: 'dup@example.invalid',
        },
      }),
    ).rejects.toThrow();
  });

  it('4. enforces foreign key integrity on non-existent parent', async () => {
    await expect(
      prisma.academicYear.create({
        data: {
          schoolId: '99999999-9999-4000-8000-999999999999',
          name: '2028-2029',
          startDate: new Date('2028-06-01'),
          endDate: new Date('2029-04-30'),
          status: 'ACTIVE',
        },
      }),
    ).rejects.toThrow();
  });

  it('5. enforces unique constraints and single ACTIVE academic year per school (BR-SCH-001)', async () => {
    // Duplicate studentIdNumber within same school must fail
    await expect(
      prisma.studentProfile.create({
        data: {
          schoolId: '10000000-0000-4000-8000-000000000001',
          userId: '10000000-0000-4000-8000-000000000010',
          studentIdNumber: 'GF-STU-2026-001',
          firstName: 'Dup',
          lastName: 'Student',
          admissionDate: new Date('2026-06-01'),
        },
      }),
    ).rejects.toThrow();

    // Second ACTIVE academic year in Greenfield must fail via partial unique index
    await expect(
      prisma.academicYear.create({
        data: {
          schoolId: '10000000-0000-4000-8000-000000000001',
          name: '2027-2028',
          startDate: new Date('2027-06-01'),
          endDate: new Date('2028-04-30'),
          status: 'ACTIVE',
        },
      }),
    ).rejects.toThrow();
  });

  it('6. enforces PostgreSQL CHECK constraints (dates, role/school, dismissal reason, feedback parent)', async () => {
    // AcademicYear end_date <= start_date rejected
    await expect(
      prisma.academicYear.create({
        data: {
          schoolId: '10000000-0000-4000-8000-000000000001',
          name: 'Invalid-Year',
          startDate: new Date('2027-06-01'),
          endDate: new Date('2027-05-01'),
          status: 'ARCHIVED',
        },
      }),
    ).rejects.toThrow();

    // SCHOOL_ADMIN without schoolId rejected
    await expect(
      prisma.user.create({
        data: {
          schoolId: null,
          email: 'orphan-admin@example.invalid',
          passwordHash: 'SYNTHETIC_DEV_HASH_NOT_FOR_PRODUCTION_USE',
          role: 'SCHOOL_ADMIN',
        },
      }),
    ).rejects.toThrow();

    // SUPER_ADMIN with non-null schoolId rejected
    await expect(
      prisma.user.create({
        data: {
          schoolId: '10000000-0000-4000-8000-000000000001',
          email: 'scoped-super@example.invalid',
          passwordHash: 'SYNTHETIC_DEV_HASH_NOT_FOR_PRODUCTION_USE',
          role: 'SUPER_ADMIN',
        },
      }),
    ).rejects.toThrow();

    // DISMISSED SupportFlag without >= 10 char reason rejected (BR-REV-002)
    await expect(
      prisma.supportFlag.create({
        data: {
          schoolId: '10000000-0000-4000-8000-000000000001',
          studentId: '10000000-0000-4000-8000-000000000121',
          flagType: 'ATTENDANCE_RISK',
          severity: 'LOW',
          rationale: 'Test rationale',
          status: 'DISMISSED',
          dismissalReason: 'too short',
        },
      }),
    ).rejects.toThrow();

    // Feedback with neither submissionId nor assessmentResultId rejected
    await expect(
      prisma.feedback.create({
        data: {
          schoolId: '10000000-0000-4000-8000-000000000001',
          authorId: '10000000-0000-4000-8000-000000000011',
          comment: 'Orphan feedback',
        },
      }),
    ).rejects.toThrow();
  });

  it('7. enforces referential deletion behavior (RESTRICT vs CASCADE)', async () => {
    // RESTRICT: cannot delete AcademicYear that has Sections
    await expect(
      prisma.academicYear.delete({
        where: { id: '10000000-0000-4000-8000-000000000201' },
      }),
    ).rejects.toThrow();

    // CASCADE: deleting a draft SupportPlan cascades to its SupportPlanActions
    const draftPlan = await prisma.supportPlan.create({
      data: {
        schoolId: '10000000-0000-4000-8000-000000000001',
        studentId: '10000000-0000-4000-8000-000000000122',
        leadTeacherId: '10000000-0000-4000-8000-000000000011',
        problemSummary: 'Draft problem',
        targetGoal: 'Draft goal',
        reviewDate: new Date('2026-11-30'),
        status: 'DRAFT',
        actionItems: {
          create: {
            assigneeId: '10000000-0000-4000-8000-000000000011',
            description: 'Draft action',
            dueDate: new Date('2026-11-20'),
          },
        },
      },
    });

    await prisma.supportPlan.delete({ where: { id: draftPlan.id } });
    const remainingActions = await prisma.supportPlanAction.findMany({
      where: { supportPlanId: draftPlan.id },
    });
    expect(remainingActions).toHaveLength(0);
  });

  it('8 & 9. enforces tenant relationship integrity and rejects cross-school foreign key references', async () => {
    // Greenfield (School 1) attempting to enroll Highcrest (School 2) student MUST fail at DB level
    await expect(
      prisma.enrollment.create({
        data: {
          schoolId: '10000000-0000-4000-8000-000000000001',
          studentId: '20000000-0000-4000-8000-000000000121', // Highcrest student!
          sectionId: '10000000-0000-4000-8000-000000000222', // Greenfield section!
          academicYearId: '10000000-0000-4000-8000-000000000201',
        },
      }),
    ).rejects.toThrow();

    // Highcrest (School 2) attempting to record attendance for Greenfield (School 1) student MUST fail
    await expect(
      prisma.attendanceRecord.create({
        data: {
          schoolId: '20000000-0000-4000-8000-000000000001',
          sectionId: '20000000-0000-4000-8000-000000000221',
          studentId: '10000000-0000-4000-8000-000000000121', // Greenfield student!
          recordedById: '20000000-0000-4000-8000-000000000011',
          attendanceDate: new Date('2026-10-15'),
          status: 'PRESENT',
        },
      }),
    ).rejects.toThrow();

    // Greenfield (School 1) attempting to create a SupportPlan for Highcrest (School 2) student MUST fail
    await expect(
      prisma.supportPlan.create({
        data: {
          schoolId: '10000000-0000-4000-8000-000000000001',
          studentId: '20000000-0000-4000-8000-000000000121', // Highcrest student!
          leadTeacherId: '10000000-0000-4000-8000-000000000011',
          problemSummary: 'Cross-tenant attempt',
          targetGoal: 'Should fail',
          reviewDate: new Date('2026-11-30'),
        },
      }),
    ).rejects.toThrow();
  });

  it('10. enforces tenant-scoped reads, updates, deletes, and rejects invalid/missing tenant context', async () => {
    const greenfieldId = '10000000-0000-4000-8000-000000000001';
    const highcrestId = '20000000-0000-4000-8000-000000000001';
    const highcrestStudentId = '20000000-0000-4000-8000-000000000121';
    const invalidSchoolId = '99999999-9999-4000-8000-999999999999';

    // Cross-tenant read scoped by schoolId returns null / isolated lists
    const gfStudents = await prisma.studentProfile.findMany({
      where: { schoolId: greenfieldId },
    });
    const hcStudents = await prisma.studentProfile.findMany({
      where: { schoolId: highcrestId },
    });
    const emptyStudents = await prisma.studentProfile.findMany({
      where: { schoolId: '30000000-0000-4000-8000-000000000001' },
    });
    const crossRead = await prisma.studentProfile.findFirst({
      where: { id: highcrestStudentId, schoolId: greenfieldId },
    });

    expect(gfStudents.map((s) => s.studentIdNumber).sort()).toEqual([
      'GF-STU-2026-001',
      'GF-STU-2026-002',
    ]);
    expect(hcStudents.map((s) => s.studentIdNumber)).toEqual(['HC-STU-2026-001']);
    expect(emptyStudents).toHaveLength(0);
    expect(crossRead).toBeNull();

    // Cross-tenant update scoped by schoolId affects 0 rows
    const crossUpdate = await prisma.studentProfile.updateMany({
      where: { id: highcrestStudentId, schoolId: greenfieldId },
      data: { firstName: 'Tampered' },
    });
    expect(crossUpdate.count).toBe(0);

    // Cross-tenant update attempting to repoint Enrollment to another school's Section fails composite FK
    await expect(
      prisma.enrollment.update({
        where: {
          schoolId_studentId_academicYearId: {
            schoolId: greenfieldId,
            studentId: '10000000-0000-4000-8000-000000000121',
            academicYearId: '10000000-0000-4000-8000-000000000201',
          },
        },
        data: {
          sectionId: '20000000-0000-4000-8000-000000000221', // Highcrest section!
        },
      }),
    ).rejects.toThrow();

    // Cross-tenant delete scoped by schoolId deletes 0 rows and leaves target intact
    const crossDelete = await prisma.studentProfile.deleteMany({
      where: { id: highcrestStudentId, schoolId: greenfieldId },
    });
    expect(crossDelete.count).toBe(0);
    const stillExists = await prisma.studentProfile.findUnique({
      where: { id: highcrestStudentId },
    });
    expect(stillExists?.firstName).toBe('Kabir');

    // Invalid / non-existent tenant context returns 0 rows on read and rejects writes
    const invalidTenantRows = await prisma.studentProfile.findMany({
      where: { schoolId: invalidSchoolId },
    });
    expect(invalidTenantRows).toHaveLength(0);

    await expect(
      prisma.subject.create({
        data: {
          schoolId: invalidSchoolId,
          name: 'Invalid Tenant Subject',
          code: 'INV-001',
        },
      }),
    ).rejects.toThrow();
  });

  it('11. rolls back all writes on transaction failure', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.subject.create({
          data: {
            schoolId: '10000000-0000-4000-8000-000000000001',
            name: 'Rollback Subject',
            code: 'RB-999',
          },
        });
        throw new Error('Simulated transaction failure');
      }),
    ).rejects.toThrow('Simulated transaction failure');

    const rolledBack = await prisma.subject.findFirst({
      where: {
        schoolId: '10000000-0000-4000-8000-000000000001',
        code: 'RB-999',
      },
    });
    expect(rolledBack).toBeNull();
  });

  it('12 & 13. verifies deterministic seed idempotency and indexed query behavior', async () => {
    // Re-running seedDatabase must remain idempotent
    await seedDatabase(prisma);

    const schools = await prisma.school.findMany({ orderBy: { code: 'asc' } });
    expect(schools.map((s) => s.code)).toEqual(['SCH-EMPTY', 'SCH-GREENFIELD', 'SCH-HIGHCREST']);

    const proposedFlags = await prisma.supportFlag.findMany({
      where: {
        schoolId: '10000000-0000-4000-8000-000000000001',
        status: 'PROPOSED',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(proposedFlags).toHaveLength(1);
    expect(proposedFlags[0]?.flagType).toBe('ACADEMIC_ENGAGEMENT_RISK');
  });
});
