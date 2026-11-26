import type {
  ChildAcademicReportDto,
  ChildAssignmentsResponseDto,
  ChildAttendanceMonthSummaryDto,
  ChildSupportPlanDto,
  ParentAbsenceNoteResponseDto,
  ParentAssignmentItemDto,
  ParentChildSummaryDto,
  ParentFamilyOverviewChildDto,
  ParentFamilyOverviewDto,
} from '@fsd-sdg4/contracts';
import type {
  SubmitAbsenceNoteInput,
  UpdateSupportActionStatusInput,
} from '@fsd-sdg4/validation';
import { prisma } from '../../shared/db/prisma.js';
import { NotFoundError } from '../../shared/errors/appError.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import { assertVerifiedGuardian } from '../identity/tenantAuthorization.js';

export async function listLinkedChildren(
  guardianUserId: string,
  schoolId: string,
): Promise<ParentChildSummaryDto[]> {
  const links = await prisma.guardianRelationship.findMany({
    where: {
      schoolId,
      guardianUserId,
      isVerified: true,
      student: { deletedAt: null },
    },
    include: {
      student: {
        include: {
          enrollments: {
            where: { schoolId, status: 'ACTIVE' },
            take: 1,
            include: {
              section: {
                include: { class: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: [{ isPrimaryContact: 'desc' }, { createdAt: 'asc' }],
  });

  return links.map((link) => {
    const enrollment = link.student.enrollments[0];
    return {
      id: link.student.id,
      firstName: link.student.firstName,
      lastName: link.student.lastName,
      studentIdNumber: link.student.studentIdNumber,
      className: enrollment?.section.class.name ?? 'Unassigned',
      sectionName: enrollment?.section.name ?? 'N/A',
      relationshipType: link.relationshipType,
      isPrimaryContact: link.isPrimaryContact,
    };
  });
}

export async function getParentOverview(
  guardianUserId: string,
  guardianEmail: string,
  schoolId: string,
): Promise<ParentFamilyOverviewDto> {
  const baseChildren = await listLinkedChildren(guardianUserId, schoolId);

  const children: ParentFamilyOverviewChildDto[] = await Promise.all(
    baseChildren.map(async (child) => {
      const [attendanceRecords, activeSupportPlanCount, recentGradesCount] = await Promise.all([
        prisma.attendanceRecord.findMany({
          where: { schoolId, studentId: child.id },
          select: { status: true },
        }),
        prisma.supportPlan.count({
          where: { schoolId, studentId: child.id, status: 'ACTIVE' },
        }),
        prisma.assessmentResult.count({
          where: { schoolId, studentId: child.id },
        }),
      ]);

      const totalDays = attendanceRecords.length;
      const presentOrLate = attendanceRecords.filter(
        (r) => r.status === 'PRESENT' || r.status === 'LATE',
      ).length;
      const unexcusedAbsenceCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
      const attendanceRate = totalDays > 0 ? Math.round((presentOrLate / totalDays) * 100) : 100;

      return {
        ...child,
        attendanceRate,
        unexcusedAbsenceCount,
        activeSupportPlanCount,
        recentGradesCount,
      };
    }),
  );

  return {
    guardianName: guardianEmail,
    children,
  };
}

export async function getChildAttendance(
  guardianUserId: string,
  schoolId: string,
  studentId: string,
  month?: string,
  ipAddress?: string | null,
): Promise<ChildAttendanceMonthSummaryDto> {
  await assertVerifiedGuardian(guardianUserId, schoolId, studentId, ipAddress);

  const targetMonth = month ?? new Date().toISOString().slice(0, 7);
  const [yearStr, monthStr] = targetMonth.split('-');
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  const startDate = new Date(Date.UTC(year, monthIdx, 1));
  const endDate = new Date(Date.UTC(year, monthIdx + 1, 1));

  const records = await prisma.attendanceRecord.findMany({
    where: {
      schoolId,
      studentId,
      attendanceDate: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: { attendanceDate: 'desc' },
  });

  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  for (const rec of records) {
    if (rec.status === 'PRESENT') present++;
    else if (rec.status === 'ABSENT') absent++;
    else if (rec.status === 'LATE') late++;
    else if (rec.status === 'EXCUSED') excused++;
  }

  const totalDays = records.length;
  const attendanceRate = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 100;

  return {
    studentId,
    month: targetMonth,
    stats: {
      totalDays,
      present,
      absent,
      late,
      excused,
      attendanceRate,
    },
    records: records.map((rec) => ({
      id: rec.id,
      attendanceDate: rec.attendanceDate.toISOString().slice(0, 10),
      status: rec.status,
      lateMinutes: rec.lateMinutes,
      remarks: rec.remarks,
      amendmentReason: rec.amendmentReason,
    })),
  };
}

export async function submitAbsenceNote(
  guardianUserId: string,
  schoolId: string,
  studentId: string,
  input: SubmitAbsenceNoteInput,
  ipAddress?: string | null,
): Promise<ParentAbsenceNoteResponseDto> {
  await assertVerifiedGuardian(guardianUserId, schoolId, studentId, ipAddress);

  const record = await prisma.attendanceRecord.findFirst({
    where: {
      id: input.attendanceRecordId,
      schoolId,
      studentId,
    },
  });

  if (!record) {
    throw new NotFoundError('Attendance record not found for this student.');
  }

  await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      remarks: input.reason,
    },
  });

  await recordAuditEvent({
    schoolId,
    actorId: guardianUserId,
    action: 'PARENT_ABSENCE_NOTE_SUBMITTED',
    entityType: 'AttendanceRecord',
    entityId: record.id,
    delta: { studentId, reasonLength: input.reason.length },
    ipAddress: ipAddress ?? null,
  });

  return {
    recorded: true,
    message: 'Absence note recorded for teacher review.',
    attendanceRecordId: record.id,
  };
}

export async function getChildGrades(
  guardianUserId: string,
  schoolId: string,
  studentId: string,
  ipAddress?: string | null,
): Promise<ChildAcademicReportDto> {
  await assertVerifiedGuardian(guardianUserId, schoolId, studentId, ipAddress);

  const student = await prisma.studentProfile.findFirst({
    where: { id: studentId, schoolId, deletedAt: null },
    include: {
      enrollments: {
        where: { schoolId, status: 'ACTIVE' },
        take: 1,
        include: {
          academicYear: { select: { id: true, name: true } },
          section: {
            include: {
              courseOfferings: {
                where: { schoolId },
                include: {
                  subject: { select: { name: true, code: true } },
                  courseTeachers: {
                    where: { schoolId, role: 'PRIMARY' },
                    take: 1,
                    include: {
                      teacher: { select: { firstName: true, lastName: true } },
                    },
                  },
                  assignments: {
                    where: { schoolId, status: 'PUBLISHED' },
                    orderBy: { dueDate: 'desc' },
                    include: {
                      submissions: {
                        where: { schoolId, studentId },
                        take: 1,
                        include: {
                          feedbacks: {
                            where: { schoolId },
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            include: {
                              author: { select: { email: true } },
                            },
                          },
                        },
                      },
                    },
                  },
                  assessments: {
                    where: { schoolId },
                    orderBy: { assessmentDate: 'desc' },
                    include: {
                      results: {
                        where: { schoolId, studentId },
                        take: 1,
                        include: {
                          feedbacks: {
                            where: { schoolId },
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!student) {
    throw new NotFoundError('Student profile not found.');
  }

  const activeEnrollment = student.enrollments[0];
  const academicYearName = activeEnrollment?.academicYear.name ?? 'Current Year';
  const offerings = activeEnrollment?.section.courseOfferings ?? [];

  return {
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    academicYearName,
    subjects: offerings.map((offering) => {
      const primaryTeacher = offering.courseTeachers[0]?.teacher;
      const teacherName = primaryTeacher
        ? `${primaryTeacher.firstName} ${primaryTeacher.lastName}`
        : 'Assigned Teacher';

      return {
        courseOfferingId: offering.id,
        subjectName: offering.subject.name,
        subjectCode: offering.subject.code,
        teacherName,
        assignments: offering.assignments.map((assignment) => {
          const submission = assignment.submissions[0];
          const latestFeedback = submission?.feedbacks[0];
          return {
            assignmentId: assignment.id,
            title: assignment.title,
            dueDate: assignment.dueDate.toISOString().slice(0, 10),
            score: submission?.score !== null && submission?.score !== undefined ? Number(submission.score) : null,
            maxPoints: Number(assignment.maxPoints),
            status: submission?.status ?? 'PENDING',
            submittedAt: submission?.submittedAt ? submission.submittedAt.toISOString() : null,
            feedback: latestFeedback?.comment ?? null,
            feedbackAuthorName: latestFeedback?.author.email ?? null,
          };
        }),
        assessments: offering.assessments
          .filter((assessment) => assessment.results.length > 0)
          .map((assessment) => {
            const result = assessment.results[0]!;
            const latestFeedback = result.feedbacks[0];
            return {
              assessmentId: assessment.id,
              title: assessment.title,
              assessmentDate: assessment.assessmentDate.toISOString().slice(0, 10),
              score: Number(result.score),
              maxMarks: Number(assessment.maxMarks),
              weightPercentage: Number(assessment.weightPercentage),
              gradeLetter: result.gradeLetter,
              notes: result.notes,
              feedback: latestFeedback?.comment ?? null,
            };
          }),
      };
    }),
  };
}

export async function getChildSupportPlans(
  guardianUserId: string,
  schoolId: string,
  studentId: string,
  ipAddress?: string | null,
): Promise<ChildSupportPlanDto[]> {
  await assertVerifiedGuardian(guardianUserId, schoolId, studentId, ipAddress);

  // Only return ACTIVE (approved) support plans. Never expose SupportFlag or confidential staff notes.
  const plans = await prisma.supportPlan.findMany({
    where: {
      schoolId,
      studentId,
      status: 'ACTIVE',
    },
    orderBy: { reviewDate: 'asc' },
    include: {
      leadTeacher: {
        select: {
          email: true,
          teacherProfile: { select: { firstName: true, lastName: true } },
        },
      },
      actionItems: {
        where: { schoolId },
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  return plans.map((plan) => {
    const teacherProfile = plan.leadTeacher.teacherProfile;
    const leadTeacherName = teacherProfile
      ? `${teacherProfile.firstName} ${teacherProfile.lastName}`
      : plan.leadTeacher.email;

    return {
      id: plan.id,
      problemSummary: plan.problemSummary,
      targetGoal: plan.targetGoal,
      reviewDate: plan.reviewDate.toISOString().slice(0, 10),
      status: plan.status,
      leadTeacherName,
      actionItems: plan.actionItems.map((item) => ({
        id: item.id,
        supportPlanId: item.supportPlanId,
        description: item.description,
        dueDate: item.dueDate.toISOString().slice(0, 10),
        status: item.status,
        completedAt: item.completedAt ? item.completedAt.toISOString() : null,
        isHomeAction: item.assigneeId === guardianUserId,
      })),
    };
  });
}

export async function updateChildSupportAction(
  guardianUserId: string,
  schoolId: string,
  studentId: string,
  actionId: string,
  input: UpdateSupportActionStatusInput,
  ipAddress?: string | null,
): Promise<{ id: string; status: 'PENDING' | 'COMPLETED'; completedAt: string | null }> {
  await assertVerifiedGuardian(guardianUserId, schoolId, studentId, ipAddress);

  const action = await prisma.supportPlanAction.findFirst({
    where: {
      id: actionId,
      schoolId,
      supportPlan: {
        schoolId,
        studentId,
        status: 'ACTIVE',
      },
    },
  });

  if (!action) {
    throw new NotFoundError('Support action item not found for this student.');
  }

  const completedAt = input.status === 'COMPLETED' ? new Date() : null;

  const updated = await prisma.supportPlanAction.update({
    where: { id: action.id },
    data: {
      status: input.status,
      completedAt,
    },
  });

  await recordAuditEvent({
    schoolId,
    actorId: guardianUserId,
    action: 'PARENT_SUPPORT_ACTION_UPDATED',
    entityType: 'SupportPlanAction',
    entityId: updated.id,
    delta: { studentId, status: input.status },
    ipAddress: ipAddress ?? null,
  });

  return {
    id: updated.id,
    status: input.status,
    completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
  };
}

export async function getChildAssignments(
  guardianUserId: string,
  schoolId: string,
  studentId: string,
  ipAddress?: string | null,
): Promise<ChildAssignmentsResponseDto> {
  await assertVerifiedGuardian(guardianUserId, schoolId, studentId, ipAddress);

  const student = await prisma.studentProfile.findFirst({
    where: { id: studentId, schoolId, deletedAt: null },
    include: {
      enrollments: {
        where: { schoolId, status: 'ACTIVE' },
        take: 1,
        include: {
          section: {
            include: {
              courseOfferings: {
                where: { schoolId },
                include: {
                  subject: { select: { name: true, code: true } },
                  courseTeachers: {
                    where: { schoolId, role: 'PRIMARY' },
                    take: 1,
                    include: {
                      teacher: { select: { firstName: true, lastName: true } },
                    },
                  },
                  assignments: {
                    where: { schoolId, status: 'PUBLISHED' },
                    orderBy: { dueDate: 'asc' },
                    include: {
                      submissions: {
                        where: { schoolId, studentId },
                        take: 1,
                        include: {
                          feedbacks: {
                            where: { schoolId },
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!student) {
    throw new NotFoundError('Student profile not found.');
  }

  const now = new Date();
  const offerings = student.enrollments[0]?.section.courseOfferings ?? [];
  const assignments: ParentAssignmentItemDto[] = [];

  for (const offering of offerings) {
    const primaryTeacher = offering.courseTeachers[0]?.teacher;
    const teacherName = primaryTeacher
      ? `${primaryTeacher.firstName} ${primaryTeacher.lastName}`
      : 'Assigned Teacher';

    for (const assignment of offering.assignments) {
      const submission = assignment.submissions[0];
      let status: ParentAssignmentItemDto['status'];
      if (submission) {
        status = submission.status;
      } else if (assignment.dueDate < now) {
        status = 'OVERDUE';
      } else {
        status = 'PENDING';
      }

      assignments.push({
        assignmentId: assignment.id,
        title: assignment.title,
        instructions: assignment.instructions,
        subjectName: offering.subject.name,
        subjectCode: offering.subject.code,
        teacherName,
        assignedDate: assignment.createdAt.toISOString().slice(0, 10),
        dueDate: assignment.dueDate.toISOString().slice(0, 10),
        maxPoints: Number(assignment.maxPoints),
        score:
          submission?.score !== null && submission?.score !== undefined
            ? Number(submission.score)
            : null,
        status,
        submittedAt: submission?.submittedAt ? submission.submittedAt.toISOString() : null,
        feedback: submission?.feedbacks[0]?.comment ?? null,
      });
    }
  }

  assignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return {
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    assignments,
  };
}
