import { Router, type Router as ExpressRouter } from 'express';
import { API_ROUTES } from '@fsd-sdg4/contracts';
import {
  allocateTeacherSchema,
  assignOfferingTeacherSchema,
  createAcademicYearSchema,
  createClassSchema,
  createOfferingSchema,
  createSectionSchema,
  createStaffSchema,
  createStudentSchema,
  createSubjectSchema,
  idParamSchema,
  invitationFilterQuerySchema,
  type InvitationFilterQuery,
  inviteUserSchema,
  offeringFilterQuerySchema,
  saveOnboardingProgressSchema,
  searchQuerySchema,
  staffFilterQuerySchema,
  updateAcademicYearSchema,
  updateClassSchema,
  updateSchoolSettingsSchema,
  updateSectionSchema,
  updateStaffSchema,
  updateSubjectSchema,
  updateUserStatusSchema,
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
  activateAcademicYear,
  allocateTeacher,
  assignOfferingTeacher,
  completeSchoolOnboarding,
  createAcademicYear,
  createClass,
  createCourseOffering,
  createSection,
  createStaff,
  createStudent,
  createSubject,
  deallocateTeacher,
  deleteClass,
  deleteCourseOffering,
  deleteSection,
  deleteStaff,
  deleteSubject,
  getSchoolOnboarding,
  getSchoolOverview,
  getSchoolSettings,
  getStaffById,
  inviteSchoolUser,
  listAcademicYears,
  listClasses,
  listCourseOfferings,
  listSchoolAuditLogs,
  listSchoolInvitations,
  listStaff,
  listStudents,
  listSubjects,
  removeOfferingTeacher,
  resendSchoolInvitation,
  revokeSchoolInvitation,
  saveOnboardingProgress,
  updateAcademicYear,
  updateClass,
  updateSchoolSettings,
  updateSection,
  updateStaff,
  updateStaffStatus,
  updateSubject,
} from './schoolAdmin.service.js';

const allocationParamSchema = z.object({
  id: idParamSchema.shape.id,
  allocationId: idParamSchema.shape.id,
});

const offeringTeacherParamSchema = z.object({
  id: idParamSchema.shape.id,
  teacherId: idParamSchema.shape.id,
});

const searchParamsSchema = z.object({
  search: searchQuerySchema,
});

export function createSchoolAdminRouter(): ExpressRouter {
  const router: ExpressRouter = Router();

  router.get(
    API_ROUTES.SCHOOL.OVERVIEW,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const overview = await getSchoolOverview(schoolId);
      sendSuccess(res, overview);
    },
  );

  router.get(
    API_ROUTES.SCHOOL.ONBOARDING,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const status = await getSchoolOnboarding(schoolId);
      sendSuccess(res, status);
    },
  );

  router.post(
    API_ROUTES.SCHOOL.ONBOARDING_PROGRESS,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ body: saveOnboardingProgressSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const result = await saveOnboardingProgress(
        schoolId,
        req.body,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, result);
    },
  );

  router.post(
    API_ROUTES.SCHOOL.ONBOARDING_COMPLETE,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const result = await completeSchoolOnboarding(schoolId, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, result);
    },
  );

  router.get(
    API_ROUTES.SCHOOL.ACADEMIC_YEARS,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const years = await listAcademicYears(schoolId);
      sendSuccess(res, years);
    },
  );

  router.post(
    API_ROUTES.SCHOOL.ACADEMIC_YEARS,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ body: createAcademicYearSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const created = await createAcademicYear(
        schoolId,
        req.body,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, created, 201);
    },
  );

  router.patch(
    `${API_ROUTES.SCHOOL.ACADEMIC_YEARS}/:id`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ params: idParamSchema, body: updateAcademicYearSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const updated = await updateAcademicYear(
        schoolId,
        id,
        req.body,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, updated);
    },
  );

  router.patch(
    `${API_ROUTES.SCHOOL.ACADEMIC_YEARS}/:id/activate`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const updated = await activateAcademicYear(schoolId, id, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, updated);
    },
  );

  router.get(
    API_ROUTES.SCHOOL.CLASSES,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const classes = await listClasses(schoolId);
      sendSuccess(res, classes);
    },
  );

  router.post(
    API_ROUTES.SCHOOL.CLASSES,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ body: createClassSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const created = await createClass(schoolId, req.body, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, created, 201);
    },
  );

  router.patch(
    `${API_ROUTES.SCHOOL.CLASSES}/:id`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ params: idParamSchema, body: updateClassSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const updated = await updateClass(schoolId, id, req.body, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, updated);
    },
  );

  router.delete(
    `${API_ROUTES.SCHOOL.CLASSES}/:id`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const result = await deleteClass(schoolId, id, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, result);
    },
  );

  router.post(
    API_ROUTES.SCHOOL.SECTIONS,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ body: createSectionSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const created = await createSection(schoolId, req.body, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, created, 201);
    },
  );

  router.patch(
    `${API_ROUTES.SCHOOL.SECTIONS}/:id`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ params: idParamSchema, body: updateSectionSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const updated = await updateSection(schoolId, id, req.body, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, updated);
    },
  );

  router.delete(
    `${API_ROUTES.SCHOOL.SECTIONS}/:id`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const result = await deleteSection(schoolId, id, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, result);
    },
  );

  router.get(
    API_ROUTES.SCHOOL.SUBJECTS,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const subjects = await listSubjects(schoolId);
      sendSuccess(res, subjects);
    },
  );

  router.post(
    API_ROUTES.SCHOOL.SUBJECTS,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ body: createSubjectSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const created = await createSubject(schoolId, req.body, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, created, 201);
    },
  );

  router.patch(
    `${API_ROUTES.SCHOOL.SUBJECTS}/:id`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ params: idParamSchema, body: updateSubjectSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const updated = await updateSubject(schoolId, id, req.body, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, updated);
    },
  );

  router.delete(
    `${API_ROUTES.SCHOOL.SUBJECTS}/:id`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const result = await deleteSubject(schoolId, id, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, result);
    },
  );

  router.get(
    API_ROUTES.SCHOOL.OFFERINGS,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_READ),
    validateRequest({ query: offeringFilterQuerySchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const offerings = await listCourseOfferings(schoolId, req.query);
      sendSuccess(res, offerings);
    },
  );

  router.post(
    API_ROUTES.SCHOOL.OFFERINGS,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ body: createOfferingSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const created = await createCourseOffering(
        schoolId,
        req.body,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, created, 201);
    },
  );

  router.delete(
    `${API_ROUTES.SCHOOL.OFFERINGS}/:id`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const result = await deleteCourseOffering(schoolId, id, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, result);
    },
  );

  router.post(
    `${API_ROUTES.SCHOOL.OFFERINGS}/:id/teachers`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ params: idParamSchema, body: assignOfferingTeacherSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const created = await assignOfferingTeacher(
        schoolId,
        id,
        req.body,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, created, 201);
    },
  );

  router.delete(
    `${API_ROUTES.SCHOOL.OFFERINGS}/:id/teachers/:teacherId`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ params: offeringTeacherParamSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id, teacherId } = req.params as { id: string; teacherId: string };
      const result = await removeOfferingTeacher(
        schoolId,
        id,
        teacherId,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, result);
    },
  );

  router.get(
    API_ROUTES.SCHOOL.STAFF,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_READ),
    validateRequest({ query: staffFilterQuerySchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const staff = await listStaff(schoolId, req.query);
      sendSuccess(res, staff);
    },
  );

  router.get(
    `${API_ROUTES.SCHOOL.STAFF}/:id`,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_READ),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const teacher = await getStaffById(schoolId, id);
      sendSuccess(res, teacher);
    },
  );

  router.post(
    API_ROUTES.SCHOOL.STAFF,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_CREATE),
    validateRequest({ body: createStaffSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const created = await createStaff(schoolId, req.body, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, created, 201);
    },
  );

  router.patch(
    `${API_ROUTES.SCHOOL.STAFF}/:id`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_UPDATE),
    validateRequest({ params: idParamSchema, body: updateStaffSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const updated = await updateStaff(schoolId, id, req.body, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, updated);
    },
  );

  router.patch(
    `${API_ROUTES.SCHOOL.STAFF}/:id/status`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_UPDATE),
    validateRequest({ params: idParamSchema, body: updateUserStatusSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const { status } = req.body as { status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' };
      const updated = await updateStaffStatus(
        schoolId,
        id,
        status,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, updated);
    },
  );

  router.post(
    `${API_ROUTES.SCHOOL.STAFF}/:id/allocations`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_UPDATE),
    validateRequest({ params: idParamSchema, body: allocateTeacherSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const allocation = await allocateTeacher(
        schoolId,
        id,
        req.body,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, allocation, 201);
    },
  );

  router.delete(
    `${API_ROUTES.SCHOOL.STAFF}/:id/allocations/:allocationId`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_UPDATE),
    validateRequest({ params: allocationParamSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id, allocationId } = req.params as { id: string; allocationId: string };
      const result = await deallocateTeacher(
        schoolId,
        id,
        allocationId,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, result);
    },
  );

  router.delete(
    `${API_ROUTES.SCHOOL.STAFF}/:id`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_UPDATE),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const result = await deleteStaff(schoolId, id, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, result);
    },
  );

  router.get(
    API_ROUTES.SCHOOL.STUDENTS,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_READ),
    validateRequest({ query: searchParamsSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { search } = req.query as { search?: string };
      const students = await listStudents(schoolId, search);
      sendSuccess(res, students);
    },
  );

  router.post(
    API_ROUTES.SCHOOL.STUDENTS,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_CREATE),
    validateRequest({ body: createStudentSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const created = await createStudent(schoolId, req.body, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, created, 201);
    },
  );

  router.get(
    API_ROUTES.SCHOOL.AUDIT_LOGS,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_AUDIT_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const logs = await listSchoolAuditLogs(schoolId);
      sendSuccess(res, logs);
    },
  );

  router.get(
    API_ROUTES.SCHOOL.SETTINGS,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_READ),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const settings = await getSchoolSettings(schoolId);
      sendSuccess(res, settings);
    },
  );

  router.patch(
    API_ROUTES.SCHOOL.SETTINGS,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_CLASSES_MANAGE),
    validateRequest({ body: updateSchoolSettingsSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const updated = await updateSchoolSettings(
        schoolId,
        req.body,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, updated);
    },
  );

  router.post(
    API_ROUTES.SCHOOL.INVITATIONS,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_CREATE),
    validateRequest({ body: inviteUserSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const invitation = await inviteSchoolUser(
        schoolId,
        req.body,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, invitation, 201);
    },
  );

  router.get(
    API_ROUTES.SCHOOL.INVITATIONS,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_READ),
    validateRequest({ query: invitationFilterQuerySchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const invitations = await listSchoolInvitations(
        schoolId,
        req.query as unknown as InvitationFilterQuery,
      );
      sendSuccess(res, invitations);
    },
  );

  router.post(
    `${API_ROUTES.SCHOOL.INVITATIONS}/:id/resend`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_CREATE),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const resent = await resendSchoolInvitation(schoolId, id, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, resent);
    },
  );

  router.delete(
    `${API_ROUTES.SCHOOL.INVITATIONS}/:id`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_DEACTIVATE),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const revoked = await revokeSchoolInvitation(schoolId, id, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, revoked);
    },
  );

  return router;
}
