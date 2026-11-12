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
