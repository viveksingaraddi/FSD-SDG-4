import { emailSchema, passwordSchema, uuidSchema, z } from '@fsd-sdg4/validation';

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
});

export const forgotPasswordBodySchema = z.object({
  email: emailSchema,
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(16, 'Reset token is required').max(256),
  newPassword: passwordSchema,
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(128),
  newPassword: passwordSchema,
});

export const sessionIdParamsSchema = z.object({
  sessionId: uuidSchema,
});

export const verifyInvitationQuerySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const acceptInvitationBodySchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
export type SessionIdParams = z.infer<typeof sessionIdParamsSchema>;
export type VerifyInvitationQuery = z.infer<typeof verifyInvitationQuerySchema>;
export type AcceptInvitationBody = z.infer<typeof acceptInvitationBodySchema>;
