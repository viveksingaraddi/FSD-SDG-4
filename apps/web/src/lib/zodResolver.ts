import type { FieldError, FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { z } from '@fsd-sdg4/validation';

/**
 * Lightweight React Hook Form resolver for Zod v4 schemas without external version drift.
 */
export function createZodResolver<TValues extends FieldValues>(
  schema: z.ZodType<TValues>,
): Resolver<TValues> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) {
      return {
        values: result.data,
        errors: {},
      };
    }

    const errors: Record<string, FieldError> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.') || 'root';
      if (errors[path] === undefined) {
        errors[path] = {
          type: issue.code,
          message: issue.message,
        };
      }
    }

    return {
      values: {},
      errors: errors as FieldErrors<TValues>,
    };
  };
}
