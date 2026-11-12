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
