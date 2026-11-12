import crypto from 'node:crypto';
import argon2 from 'argon2';

export interface PasswordHashOptions {
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
}

/**
 * Default Argon2id parameters per ADR-0004 (RFC 9106):
 * 64 MiB memory, 3 iterations, 4 parallel threads.
 */
export const DEFAULT_ARGON2_OPTIONS: Required<PasswordHashOptions> = {
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 4,
};

export async function hashPassword(
  plainText: string,
  options: PasswordHashOptions = {},
): Promise<string> {
  return argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: options.memoryCost ?? DEFAULT_ARGON2_OPTIONS.memoryCost,
    timeCost: options.timeCost ?? DEFAULT_ARGON2_OPTIONS.timeCost,
    parallelism: options.parallelism ?? DEFAULT_ARGON2_OPTIONS.parallelism,
  });
}

export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

export function generateOpaqueToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('base64url');
}

export function hashOpaqueToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
