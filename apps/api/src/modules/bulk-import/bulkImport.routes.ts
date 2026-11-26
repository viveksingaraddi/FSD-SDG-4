import { Router, type Router as ExpressRouter } from 'express';
import multer from 'multer';
import { API_ROUTES } from '@fsd-sdg4/contracts';
import {
  bulkImportCategorySchema,
  bulkImportFilterQuerySchema,
  idParamSchema,
  type BulkImportFilterQuery,
} from '@fsd-sdg4/validation';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission, requireRole } from '../../middleware/authorize.js';
import { requireCsrfHeader } from '../../middleware/csrf.js';
import { BadRequestError } from '../../shared/errors/appError.js';
import { sendSuccess } from '../../shared/http/response.js';
import { validateRequest } from '../../shared/validation/validateRequest.js';
import { PERMISSIONS } from '../identity/permissions.js';
import { resolveTenantSchoolId } from '../identity/tenantAuthorization.js';
import {
  executeImportJob,
  generateJobErrorReportCsv,
  generateTemplate,
  getImportJobById,
  listImportJobs,
  parseAndValidateImportFile,
} from './bulkImport.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const originalName = file.originalname.toLowerCase();
    if (
      originalName.endsWith('.csv') ||
      originalName.endsWith('.xlsx') ||
      originalName.endsWith('.xls')
    ) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only CSV and XLSX spreadsheet files are supported.'));
    }
  },
});

export function createBulkImportRouter(): ExpressRouter {
  const router = Router();

  // 1. Download Template
  router.get(
    API_ROUTES.SCHOOL.BULK_IMPORT.TEMPLATE,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_CREATE),
    async (req, res) => {
      const categoryParam = String(req.query['category'] || 'STUDENTS').toUpperCase();
      const formatParam = String(req.query['format'] || 'csv').toLowerCase();

      const parsedCategory = bulkImportCategorySchema.safeParse(categoryParam);
      if (!parsedCategory.success) {
        throw new BadRequestError(
          'Invalid template category. Choose STUDENTS, TEACHERS, or PARENTS.',
        );
      }

      const format = formatParam === 'xlsx' ? 'xlsx' : 'csv';
      const template = generateTemplate(parsedCategory.data, format);

      res.setHeader('Content-Type', template.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${template.filename}"`);
      res.send(template.buffer);
    },
  );

  // 2. Validate & Preview File
  router.post(
    API_ROUTES.SCHOOL.BULK_IMPORT.PREVIEW,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_CREATE),
    upload.single('file'),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);

      if (!req.file || !req.file.buffer) {
        throw new BadRequestError('Please select a file to upload.');
      }

      const categoryRaw = req.body['category'] || req.query['category'];
      const parsedCat = bulkImportCategorySchema.safeParse(String(categoryRaw || '').toUpperCase());
      if (!parsedCat.success) {
        throw new BadRequestError(
          'Valid import category is required (STUDENTS, TEACHERS, PARENTS).',
        );
      }

      const preview = await parseAndValidateImportFile(
        schoolId,
        parsedCat.data,
        req.file.buffer,
        req.file.originalname,
      );

      sendSuccess(res, preview);
    },
  );

  // 3. Execute Import Job
  router.post(
    API_ROUTES.SCHOOL.BULK_IMPORT.EXECUTE,
    authenticate,
    requireCsrfHeader,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_CREATE),
    upload.single('file'),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);

      if (!req.file || !req.file.buffer) {
        throw new BadRequestError('Please provide the spreadsheet file to import.');
      }

      const categoryRaw = req.body['category'] || req.query['category'];
      const parsedCat = bulkImportCategorySchema.safeParse(String(categoryRaw || '').toUpperCase());
      if (!parsedCat.success) {
        throw new BadRequestError(
          'Valid import category is required (STUDENTS, TEACHERS, PARENTS).',
        );
      }

      const idempotencyKey = req.body['idempotencyKey']
        ? String(req.body['idempotencyKey']).trim()
        : undefined;

      const skipInvalidRows =
        req.body['skipInvalidRows'] !== undefined
          ? String(req.body['skipInvalidRows']).toLowerCase() === 'true'
          : true;

      const sendInvitations =
        req.body['sendInvitations'] !== undefined
          ? String(req.body['sendInvitations']).toLowerCase() === 'true'
          : true;

      const job = await executeImportJob(
        schoolId,
        req.auth!.userId,
        parsedCat.data,
        req.file.buffer,
        req.file.originalname,
        { idempotencyKey, skipInvalidRows, sendInvitations },
        req.ip ?? null,
      );

      sendSuccess(res, job, 201);
    },
  );

  // 4. List Import Jobs History
  router.get(
    API_ROUTES.SCHOOL.BULK_IMPORT.JOBS,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_READ),
    validateRequest({ query: bulkImportFilterQuerySchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const query = (req.validated?.query ?? req.query) as unknown as BulkImportFilterQuery;
      const result = await listImportJobs(schoolId, query);
      sendSuccess(res, result);
    },
  );

  // 5. Get Import Job Details
  router.get(
    API_ROUTES.SCHOOL.BULK_IMPORT.JOB_DETAIL,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_READ),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const job = await getImportJobById(schoolId, id);
      sendSuccess(res, job);
    },
  );

  // 6. Download Error Report
  router.get(
    API_ROUTES.SCHOOL.BULK_IMPORT.JOB_ERRORS,
    authenticate,
    requireRole(['SCHOOL_ADMIN']),
    requirePermission(PERMISSIONS.SCHOOL_USERS_READ),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const schoolId = await resolveTenantSchoolId(req);
      const { id } = req.params as { id: string };
      const report = await generateJobErrorReportCsv(schoolId, id);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.send(report.csvContent);
    },
  );

  return router;
}
