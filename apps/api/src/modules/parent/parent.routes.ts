import { Router, type Router as ExpressRouter } from 'express';
import { API_ROUTES } from '@fsd-sdg4/contracts';
import {
  attendanceMonthQuerySchema,
  parentActionParamsSchema,
  parentStudentParamsSchema,
  submitAbsenceNoteSchema,
  updateSupportActionStatusSchema,
} from '@fsd-sdg4/validation';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission, requireRole } from '../../middleware/authorize.js';
import { requireCsrfHeader } from '../../middleware/csrf.js';
import { sendSuccess } from '../../shared/http/response.js';
import { validateRequest } from '../../shared/validation/validateRequest.js';
import { PERMISSIONS } from '../identity/permissions.js';
import { resolveTenantSchoolId } from '../identity/tenantAuthorization.js';
import {
  getChildAssignments,
  getChildAttendance,
  getChildGrades,
  getChildSupportPlans,
  getParentOverview,
  listLinkedChildren,
  submitAbsenceNote,
  updateChildSupportAction,
} from './parent.service.js';

export function createParentRouter(): ExpressRouter {
  const router: ExpressRouter = Router();

  router.get(
    API_ROUTES.PARENT.OVERVIEW,
    authenticate,
    requireRole(['PARENT']),
    requirePermission(PERMISSIONS.PARENT_CHILDREN_READ_LINKED),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const overview = await getParentOverview(req.auth!.userId, req.auth!.email, schoolId);
      sendSuccess(res, overview);
    },
  );

  router.get(
    API_ROUTES.PARENT.CHILDREN,
    authenticate,
    requireRole(['PARENT']),
    requirePermission(PERMISSIONS.PARENT_CHILDREN_READ_LINKED),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const children = await listLinkedChildren(req.auth!.userId, schoolId);
      sendSuccess(res, children);
    },
  );

  router.get(
    API_ROUTES.PARENT.CHILD_ATTENDANCE,
    authenticate,
    requireRole(['PARENT']),
    requirePermission(PERMISSIONS.PARENT_CHILDREN_READ_LINKED),
    validateRequest({ params: parentStudentParamsSchema, query: attendanceMonthQuerySchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { studentId } = req.validated!.params as { studentId: string };
      const { month } = (req.validated!.query ?? {}) as { month?: string };
      const summary = await getChildAttendance(
        req.auth!.userId,
        schoolId,
        studentId,
        month,
        req.ip ?? null,
      );
      sendSuccess(res, summary);
    },
  );

  router.post(
    API_ROUTES.PARENT.ABSENCE_NOTES,
    authenticate,
    requireCsrfHeader,
    requireRole(['PARENT']),
    requirePermission(PERMISSIONS.PARENT_CHILDREN_READ_LINKED),
    validateRequest({ params: parentStudentParamsSchema, body: submitAbsenceNoteSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { studentId } = req.validated!.params as { studentId: string };
      const body = req.validated!.body as { attendanceRecordId: string; reason: string };
      const result = await submitAbsenceNote(
        req.auth!.userId,
        schoolId,
        studentId,
        body,
        req.ip ?? null,
      );
      sendSuccess(res, result, 200);
    },
  );

  router.get(
    API_ROUTES.PARENT.CHILD_ASSIGNMENTS,
    authenticate,
    requireRole(['PARENT']),
    requirePermission(PERMISSIONS.PARENT_CHILDREN_READ_LINKED),
    validateRequest({ params: parentStudentParamsSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { studentId } = req.validated!.params as { studentId: string };
      const assignments = await getChildAssignments(
        req.auth!.userId,
        schoolId,
        studentId,
        req.ip ?? null,
      );
      sendSuccess(res, assignments);
    },
  );

  router.get(
    API_ROUTES.PARENT.CHILD_GRADES,
    authenticate,
    requireRole(['PARENT']),
    requirePermission(PERMISSIONS.PARENT_CHILDREN_READ_LINKED),
    validateRequest({ params: parentStudentParamsSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { studentId } = req.validated!.params as { studentId: string };
      const report = await getChildGrades(req.auth!.userId, schoolId, studentId, req.ip ?? null);
      sendSuccess(res, report);
    },
  );

  router.get(
    API_ROUTES.PARENT.CHILD_SUPPORT_PLANS,
    authenticate,
    requireRole(['PARENT']),
    requirePermission(PERMISSIONS.PARENT_CHILDREN_READ_LINKED),
    validateRequest({ params: parentStudentParamsSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { studentId } = req.validated!.params as { studentId: string };
      const plans = await getChildSupportPlans(
        req.auth!.userId,
        schoolId,
        studentId,
        req.ip ?? null,
      );
      sendSuccess(res, plans);
    },
  );

  router.patch(
    API_ROUTES.PARENT.SUPPORT_ACTION_UPDATE,
    authenticate,
    requireCsrfHeader,
    requireRole(['PARENT']),
    requirePermission(PERMISSIONS.PARENT_CHILDREN_READ_LINKED),
    validateRequest({ params: parentActionParamsSchema, body: updateSupportActionStatusSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { studentId, actionId } = req.validated!.params as {
        studentId: string;
        actionId: string;
      };
      const body = req.validated!.body as { status: 'PENDING' | 'COMPLETED' };
      const updated = await updateChildSupportAction(
        req.auth!.userId,
        schoolId,
        studentId,
        actionId,
        body,
        req.ip ?? null,
      );
      sendSuccess(res, updated);
    },
  );

  return router;
}
