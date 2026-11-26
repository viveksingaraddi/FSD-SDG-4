import { Router, type Router as ExpressRouter } from 'express';
import { API_ROUTES } from '@fsd-sdg4/contracts';
import {
  createTeacherAssessmentSchema,
  createTeacherAssignmentSchema,
  searchQuerySchema,
  submitAttendanceRosterSchema,
  teacherSectionDateQuerySchema,
  z,
} from '@fsd-sdg4/validation';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission, requireRole } from '../../middleware/authorize.js';
import { requireCsrfHeader } from '../../middleware/csrf.js';
import { sendSuccess } from '../../shared/http/response.js';
import { validateRequest } from '../../shared/validation/validateRequest.js';
import { PERMISSIONS } from '../identity/permissions.js';
import { resolveTenantSchoolId } from '../identity/tenantAuthorization.js';
import {
  createTeacherAssessment,
  createTeacherAssignment,
  getAttendanceRoster,
  getTeacherAnnouncements,
  getTeacherAssessments,
  getTeacherAssignments,
  getTeacherClasses,
  getTeacherDashboard,
  getTeacherMessages,
  getTeacherProfileByUserId,
  getTeacherStudents,
  getTeacherTimetable,
  submitAttendanceRoster,
} from './teacher.service.js';

const searchParamsSchema = z.object({
  search: searchQuerySchema,
});

export function createTeacherRouter(): ExpressRouter {
  const router: ExpressRouter = Router();

  // 1. Dashboard Overview
  router.get(
    API_ROUTES.TEACHER.DASHBOARD,
    authenticate,
    requireRole(['TEACHER']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const dashboard = await getTeacherDashboard(req.auth!.userId, schoolId);
      sendSuccess(res, dashboard);
    },
  );

  // 2. Assigned Classes & Sections
  router.get(
    API_ROUTES.TEACHER.CLASSES,
    authenticate,
    requireRole(['TEACHER']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const classes = await getTeacherClasses(req.auth!.userId, schoolId);
      sendSuccess(res, classes);
    },
  );

  // 3. Students Enrolled in Teacher's Sections
  router.get(
    API_ROUTES.TEACHER.STUDENTS,
    authenticate,
    requireRole(['TEACHER']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_READ),
    validateRequest({ query: searchParamsSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { search } = req.query as { search?: string };
      const students = await getTeacherStudents(req.auth!.userId, schoolId, search);
      sendSuccess(res, students);
    },
  );

  // 4. Attendance Roster (GET)
  router.get(
    API_ROUTES.TEACHER.ATTENDANCE,
    authenticate,
    requireRole(['TEACHER']),
    requirePermission(PERMISSIONS.ATTENDANCE_READ),
    validateRequest({ query: teacherSectionDateQuerySchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { sectionId, date } = req.query as { sectionId?: string; date?: string };
      const roster = await getAttendanceRoster(req.auth!.userId, schoolId, sectionId, date);
      sendSuccess(res, roster);
    },
  );

  // 5. Submit Attendance Roster (POST)
  router.post(
    API_ROUTES.TEACHER.ATTENDANCE,
    authenticate,
    requireCsrfHeader,
    requireRole(['TEACHER']),
    requirePermission(PERMISSIONS.ATTENDANCE_CREATE),
    validateRequest({ body: submitAttendanceRosterSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const result = await submitAttendanceRoster(
        req.auth!.userId,
        schoolId,
        req.body,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, result, 201);
    },
  );

  // 6. Assignments (GET & POST)
  router.get(
    API_ROUTES.TEACHER.ASSIGNMENTS,
    authenticate,
    requireRole(['TEACHER']),
    requirePermission(PERMISSIONS.ASSIGNMENTS_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const assignments = await getTeacherAssignments(req.auth!.userId, schoolId);
      sendSuccess(res, assignments);
    },
  );

  router.post(
    API_ROUTES.TEACHER.ASSIGNMENTS,
    authenticate,
    requireCsrfHeader,
    requireRole(['TEACHER']),
    requirePermission(PERMISSIONS.ASSIGNMENTS_CREATE),
    validateRequest({ body: createTeacherAssignmentSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const created = await createTeacherAssignment(
        req.auth!.userId,
        schoolId,
        req.body,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, created, 201);
    },
  );

  // 7. Assessments & Examinations (GET & POST)
  router.get(
    API_ROUTES.TEACHER.ASSESSMENTS,
    authenticate,
    requireRole(['TEACHER']),
    requirePermission(PERMISSIONS.ASSESSMENTS_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const assessments = await getTeacherAssessments(req.auth!.userId, schoolId);
      sendSuccess(res, assessments);
    },
  );

  router.post(
    API_ROUTES.TEACHER.ASSESSMENTS,
    authenticate,
    requireCsrfHeader,
    requireRole(['TEACHER']),
    requirePermission(PERMISSIONS.ASSESSMENTS_MANAGE),
    validateRequest({ body: createTeacherAssessmentSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const created = await createTeacherAssessment(
        req.auth!.userId,
        schoolId,
        req.body,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, created, 201);
    },
  );

  // 8. Timetable (GET)
  router.get(
    API_ROUTES.TEACHER.TIMETABLE,
    authenticate,
    requireRole(['TEACHER']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const timetable = await getTeacherTimetable(req.auth!.userId, schoolId);
      sendSuccess(res, timetable);
    },
  );

  // 9. Announcements (GET)
  router.get(
    API_ROUTES.TEACHER.ANNOUNCEMENTS,
    authenticate,
    requireRole(['TEACHER']),
    requirePermission(PERMISSIONS.RESOURCES_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const announcements = await getTeacherAnnouncements(req.auth!.userId, schoolId);
      sendSuccess(res, announcements);
    },
  );

  // 10. Messages (GET)
  router.get(
    API_ROUTES.TEACHER.MESSAGES,
    authenticate,
    requireRole(['TEACHER']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const messages = await getTeacherMessages(req.auth!.userId, schoolId);
      sendSuccess(res, messages);
    },
  );

  // 11. Profile (GET)
  router.get(
    API_ROUTES.TEACHER.PROFILE,
    authenticate,
    requireRole(['TEACHER']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const teacher = await getTeacherProfileByUserId(req.auth!.userId, schoolId);
      sendSuccess(res, {
        id: teacher.id,
        userId: teacher.userId,
        employeeId: teacher.employeeId,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.user.email,
        specialization: teacher.specialization,
        schoolName: teacher.school.name,
      });
    },
  );

  return router;
}
