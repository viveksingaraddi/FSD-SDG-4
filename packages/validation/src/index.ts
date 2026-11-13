/**
 * @fsd-sdg4/validation
 *
 * Shared Zod validation schemas — isomorphic runtime validation.
 * Used by: frontend React Hook Form validation AND backend Zod request validation middleware.
 *
 * Import boundary: Safe for both browser (apps/web) and server (apps/api).
 * MUST NOT import backend-only packages (express, pino, prisma).
 * MUST NOT contain secrets or environment-specific values.
 */

import { z } from 'zod';

export { z };
export type { ZodError, ZodIssue } from 'zod';

// ─── Shared Validation Helpers ─────────────────────────────────────────────

/**
 * Validates that a string is a non-empty, trimmed value.
 * Used for required text fields in forms and API request bodies.
 */
export const nonEmptyString = (fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `${fieldName} cannot be empty` });

/**
 * Validates email format for login and user management forms.
 * Aligns with the platform's institutional email requirement.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Please enter a valid email address' });

/**
 * Validates pagination query parameters.
 * Defaults: page=1, limit=25. Max limit=100 to prevent abuse.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Validates an ISO 8601 date string (YYYY-MM-DD).
 * Used for attendance date parameters, academic year boundaries.
 */
export const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' });

/**
 * Validates a standard UUID identifier (v4/v7).
 */
export const uuidSchema = z.string().uuid({ message: 'Must be a valid UUID' });

/**
 * Validates standard `:id` route parameter.
 */
export const idParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Validates sort direction query parameter.
 */
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

export type SortOrder = z.infer<typeof sortOrderSchema>;

/**
 * Creates a strict sort query schema restricted to an explicit allowlist of fields.
 */
export function createSortSchema<T extends readonly [string, ...string[]]>(
  allowedFields: T,
  defaultField: T[number] = allowedFields[0],
) {
  return z.object({
    sortBy: z.enum(allowedFields).default(defaultField),
    sortOrder: sortOrderSchema,
  });
}

/**
 * Validates optional search query string (trimmed, bounded length to prevent abuse).
 */
export const searchQuerySchema = z.string().trim().min(1).max(100).optional();

/**
 * Reusable paginated list query schema with optional search and sort direction.
 */
export const paginatedQuerySchema = paginationSchema.extend({
  search: searchQuerySchema,
  sortOrder: sortOrderSchema,
});

export type PaginatedQueryParams = z.infer<typeof paginatedQuerySchema>;

/**
 * Password complexity schema per FSD-SDG-4 Phase 7 security policy:
 * 12-128 chars, requiring uppercase, lowercase, digit, and special character.
 */
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ─── Admin Portal Schemas (Phase 10) ────────────────────────────────────────

export const schoolStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']);

export const createSchoolSchema = z
  .object({
    name: nonEmptyString('School name').max(200),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(2, 'School code must be at least 2 characters')
      .max(64)
      .regex(/^[A-Z0-9_-]+$/, 'School code may contain letters, numbers, hyphens, and underscores'),
    subdomain: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, 'Subdomain must be at least 2 characters')
      .max(64)
      .regex(/^[a-z0-9-]+$/, 'Subdomain may contain lowercase letters, numbers, and hyphens'),
    contactEmail: emailSchema,
    adminFirstName: z.string().trim().max(100).optional(),
    adminLastName: z.string().trim().max(100).optional(),
    adminEmail: emailSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.adminEmail || data.adminFirstName || data.adminLastName) {
        return !!data.adminEmail && !!data.adminFirstName && !!data.adminLastName;
      }
      return true;
    },
    {
      message:
        'When provisioning an initial administrator, first name, last name, and admin email are all required.',
      path: ['adminEmail'],
    },
  );

export const updateSchoolSchema = z.object({
  name: nonEmptyString('School name').max(200).optional(),
  contactEmail: emailSchema.optional(),
  status: schoolStatusSchema.optional(),
});

export const createAcademicYearSchema = z.object({
  name: nonEmptyString('Academic year name').max(64),
  startDate: isoDateString,
  endDate: isoDateString,
});

export const updateAcademicYearSchema = z.object({
  name: nonEmptyString('Academic year name').max(64).optional(),
  startDate: isoDateString.optional(),
  endDate: isoDateString.optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
});

export const createClassSchema = z.object({
  name: nonEmptyString('Class name').max(100),
  stage: nonEmptyString('Stage').max(64),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const updateClassSchema = z.object({
  name: nonEmptyString('Class name').max(100).optional(),
  stage: nonEmptyString('Stage').max(64).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export const createSectionSchema = z.object({
  classId: uuidSchema,
  academicYearId: uuidSchema,
  name: nonEmptyString('Section name').max(64),
  capacity: z.coerce.number().int().min(1).max(500).optional(),
  roomNumber: z.string().trim().max(32).optional(),
});

export const updateSectionSchema = z.object({
  name: nonEmptyString('Section name').max(64).optional(),
  capacity: z.coerce.number().int().min(1).max(500).nullable().optional(),
  roomNumber: z.string().trim().max(32).nullable().optional(),
});

export const createSubjectSchema = z.object({
  name: nonEmptyString('Subject name').max(120),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Subject code must be at least 2 characters')
    .max(32),
  description: z.string().trim().max(500).optional(),
});

export const updateSubjectSchema = z.object({
  name: nonEmptyString('Subject name').max(120).optional(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Subject code must be at least 2 characters')
    .max(32)
    .optional(),
  description: z.string().trim().max(500).nullable().optional(),
  credits: z.coerce.number().min(0).max(99.99).nullable().optional(),
});

export const createOfferingSchema = z.object({
  academicYearId: uuidSchema,
  sectionId: uuidSchema,
  subjectId: uuidSchema,
  syllabus: z.string().trim().max(5000).optional(),
  teacherId: uuidSchema.optional(),
  role: z.enum(['PRIMARY', 'ASSISTANT']).default('PRIMARY'),
});

export const offeringFilterQuerySchema = z.object({
  academicYearId: uuidSchema.optional(),
  classId: uuidSchema.optional(),
  sectionId: uuidSchema.optional(),
  subjectId: uuidSchema.optional(),
});

export const assignOfferingTeacherSchema = z.object({
  teacherId: uuidSchema,
  role: z.enum(['PRIMARY', 'ASSISTANT']).default('PRIMARY'),
});

export const createStaffSchema = z.object({
  email: emailSchema,
  employeeId: nonEmptyString('Employee ID').max(64),
  firstName: nonEmptyString('First name').max(100),
  lastName: nonEmptyString('Last name').max(100),
  specialization: z.string().trim().max(150).optional(),
  temporaryPassword: passwordSchema,
});

export const updateStaffSchema = z.object({
  firstName: nonEmptyString('First name').max(100).optional(),
  lastName: nonEmptyString('Last name').max(100).optional(),
  specialization: z.string().trim().max(150).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(),
});

export const staffFilterQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['ALL', 'ACTIVE', 'INACTIVE', 'LOCKED']).optional(),
  specialization: z.string().trim().optional(),
});

export const allocateTeacherSchema = z.object({
  academicYearId: uuidSchema,
  subjectId: uuidSchema,
  sectionId: uuidSchema,
  role: z.enum(['PRIMARY', 'ASSISTANT']).default('PRIMARY'),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
});

export const createStudentSchema = z.object({
  email: emailSchema,
  studentIdNumber: nonEmptyString('Student ID').max(64),
  firstName: nonEmptyString('First name').max(100),
  lastName: nonEmptyString('Last name').max(100),
  admissionDate: isoDateString,
  dateOfBirth: isoDateString.optional(),
  gender: z.string().trim().max(32).optional(),
  temporaryPassword: passwordSchema,
  sectionId: uuidSchema.optional(),
});

export const updateStudentSchema = z.object({
  firstName: nonEmptyString('First name').max(100).optional(),
  lastName: nonEmptyString('Last name').max(100).optional(),
  dateOfBirth: isoDateString.nullable().optional(),
  gender: z.string().trim().max(32).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED']).optional(),
  sectionId: uuidSchema.nullable().optional(),
});

export const studentFilterQuerySchema = z.object({
  search: searchQuerySchema,
  classId: uuidSchema.optional(),
  sectionId: uuidSchema.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED']).optional(),
});

export const updateSchoolSettingsSchema = z.object({
  name: nonEmptyString('School name').max(200),
  contactEmail: emailSchema,
});

export const inviteUserSchema = z.object({
  email: emailSchema,
  role: z.enum(['TEACHER', 'STUDENT', 'PARENT']),
  firstName: nonEmptyString('First name').max(100),
  lastName: nonEmptyString('Last name').max(100),
  employeeId: z.string().trim().max(64).optional(),
  specialization: z.string().trim().max(150).optional(),
  studentIdNumber: z.string().trim().max(64).optional(),
  dateOfBirth: isoDateString.optional(),
  gender: z.string().trim().max(32).optional(),
  admissionDate: isoDateString.optional(),
  sectionId: uuidSchema.optional(),
  phone: z.string().trim().max(32).optional(),
  studentId: uuidSchema.optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().trim().min(32, 'Invitation token must be at least 32 characters'),
  password: passwordSchema,
});

export const invitationFilterQuerySchema = z.object({
  search: searchQuerySchema,
  status: z.enum(['ALL', 'PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED']).optional(),
  role: z.enum(['ALL', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']).optional(),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearInput = z.infer<typeof updateAcademicYearSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateOfferingInput = z.infer<typeof createOfferingSchema>;
export type OfferingFilterQuery = z.infer<typeof offeringFilterQuerySchema>;
export type AssignOfferingTeacherInput = z.infer<typeof assignOfferingTeacherSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type StaffFilterQuery = z.infer<typeof staffFilterQuerySchema>;
export type AllocateTeacherInput = z.infer<typeof allocateTeacherSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentFilterQuery = z.infer<typeof studentFilterQuerySchema>;
export type UpdateSchoolSettingsInput = z.infer<typeof updateSchoolSettingsSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type InvitationFilterQuery = z.infer<typeof invitationFilterQuerySchema>;
