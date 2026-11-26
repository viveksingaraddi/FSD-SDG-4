import type { Request } from 'express';
import { and } from '@prisma/orm-postgres/orm-client';
import { prisma } from '../../shared/database/index.js';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors/appError.js';
import { AUDIT_ACTIONS, recordAuditEvent } from '../audit/audit.service.js';

/**
 * Resolves the authoritative schoolId from the authenticated session context.
 * Rejects any attempt by a school-scoped user to supply a mismatched schoolId.
 */
export async function resolveTenantSchoolId(
  req: Request,
  clientSuppliedSchoolId?: string | null,
): Promise<string> {
  if (req.auth === undefined) {
    throw new UnauthorizedError('Authentication is required.');
  }

  if (req.auth.role === 'SUPER_ADMIN') {
    if (clientSuppliedSchoolId !== undefined && clientSuppliedSchoolId !== null) {
      return clientSuppliedSchoolId;
    }
    throw new ForbiddenError('Platform Super Admin must target an explicit schoolId.');
  }

  const sessionSchoolId = req.auth.schoolId;
  if (sessionSchoolId === null) {
    throw new ForbiddenError('Tenant context is missing from authenticated session.');
  }

  if (
    clientSuppliedSchoolId !== undefined &&
    clientSuppliedSchoolId !== null &&
    clientSuppliedSchoolId !== sessionSchoolId
  ) {
    await recordAuditEvent({
      schoolId: sessionSchoolId,
      actorId: req.auth.userId,
      action: AUDIT_ACTIONS.AUTH_AUTHORIZATION_DENIED,
      entityType: 'School',
      entityId: clientSuppliedSchoolId,
      delta: { reason: 'cross_tenant_school_id_mismatch' },
      ipAddress: req.ip ?? null,
    });
    throw new ForbiddenError('Cross-tenant access denied.');
  }

  return sessionSchoolId;
}

/**
 * Verifies that a TEACHER is assigned to the target CourseOffering within their school.
 */
export async function assertTeacherAssignedToCourse(
  userId: string,
  schoolId: string,
  courseOfferingId: string,
  ipAddress?: string | null,
): Promise<void> {
  const assignment = await prisma.orm.public.CourseTeacher.select('id')
    .where((courseTeacher) =>
      and(
        courseTeacher.schoolId.eq(schoolId),
        courseTeacher.courseOfferingId.eq(courseOfferingId),
        courseTeacher.teacher.some((teacher) =>
          and(teacher.userId.eq(userId), teacher.schoolId.eq(schoolId)),
        ),
      ),
    )
    .first();

  if (assignment === null) {
    await recordAuditEvent({
      schoolId,
      actorId: userId,
      action: AUDIT_ACTIONS.AUTH_AUTHORIZATION_DENIED,
      entityType: 'CourseOffering',
      entityId: courseOfferingId,
      delta: { reason: 'teacher_not_assigned_to_course' },
      ipAddress: ipAddress ?? null,
    });
    throw new ForbiddenError('You are not assigned to this course offering.');
  }
}

/**
 * Verifies that a TEACHER is assigned to the target Section (via homeroom or CourseTeacher).
 */
export async function assertTeacherAssignedToSection(
  userId: string,
  schoolId: string,
  sectionId: string,
  ipAddress?: string | null,
): Promise<void> {
  const teacherProfile = await prisma.orm.public.TeacherProfile.select('id')
    .where({ userId, schoolId })
    .first();

  if (teacherProfile === null) {
    throw new ForbiddenError('Teacher profile not found in tenant.');
  }

  const courseMatch = await prisma.orm.public.CourseTeacher.select('id')
    .where((courseTeacher) =>
      and(
        courseTeacher.schoolId.eq(schoolId),
        courseTeacher.teacherId.eq(teacherProfile.id),
        courseTeacher.courseOffering.some((courseOffering) =>
          and(courseOffering.sectionId.eq(sectionId), courseOffering.schoolId.eq(schoolId)),
        ),
      ),
    )
    .first();

  if (courseMatch === null) {
    await recordAuditEvent({
      schoolId,
      actorId: userId,
      action: AUDIT_ACTIONS.AUTH_AUTHORIZATION_DENIED,
      entityType: 'Section',
      entityId: sectionId,
      delta: { reason: 'teacher_not_assigned_to_section' },
      ipAddress: ipAddress ?? null,
    });
    throw new ForbiddenError('You are not assigned to this section.');
  }
}

/**
 * Verifies that a STUDENT is accessing only their own StudentProfile.
 */
export async function assertStudentSelf(
  userId: string,
  schoolId: string,
  studentProfileId: string,
  ipAddress?: string | null,
): Promise<void> {
  const student = await prisma.orm.public.StudentProfile.select('id')
    .where({ id: studentProfileId, schoolId, userId })
    .first();

  if (student === null) {
    await recordAuditEvent({
      schoolId,
      actorId: userId,
      action: AUDIT_ACTIONS.AUTH_AUTHORIZATION_DENIED,
      entityType: 'StudentProfile',
      entityId: studentProfileId,
      delta: { reason: 'student_self_access_violation' },
      ipAddress: ipAddress ?? null,
    });
    throw new ForbiddenError('Students may only access their own records.');
  }
}

/**
 * Verifies that a PARENT holds a verified GuardianRelationship to the target student within the school.
 */
export async function assertVerifiedGuardian(
  guardianUserId: string,
  schoolId: string,
  studentProfileId: string,
  ipAddress?: string | null,
): Promise<void> {
  const link = await prisma.orm.public.GuardianRelationship.select('id')
    .where({ schoolId, guardianUserId, studentId: studentProfileId, isVerified: true })
    .first();

  if (link === null) {
    await recordAuditEvent({
      schoolId,
      actorId: guardianUserId,
      action: AUDIT_ACTIONS.AUTH_AUTHORIZATION_DENIED,
      entityType: 'StudentProfile',
      entityId: studentProfileId,
      delta: { reason: 'unverified_or_missing_guardian_relationship' },
      ipAddress: ipAddress ?? null,
    });
    throw new ForbiddenError('Access requires a verified guardian-student relationship.');
  }
}
