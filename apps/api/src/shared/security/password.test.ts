import { describe, it, expect } from 'vitest';
import { generateOpaqueToken, hashOpaqueToken, hashPassword, verifyPassword } from './password.js';

describe('Argon2id password security', () => {
  it('hashes with Argon2id and verifies matching password', async () => {
    const hash = await hashPassword('StrongEduPass!2026', {
      memoryCost: 16_384,
      timeCost: 2,
      parallelism: 1,
    });
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hash, 'StrongEduPass!2026')).toBe(true);
    expect(await verifyPassword(hash, 'WrongPass!2026')).toBe(false);
  });

  it('returns false for malformed hashes without throwing', async () => {
    expect(await verifyPassword('not-a-valid-hash', 'anything')).toBe(false);
  });

  it('generates high-entropy opaque tokens and deterministic SHA-256 hashes', () => {
    const tokenA = generateOpaqueToken(32);
    const tokenB = generateOpaqueToken(32);
    expect(tokenA).not.toBe(tokenB);
    expect(tokenA.length).toBeGreaterThanOrEqual(40);
    expect(hashOpaqueToken(tokenA)).toHaveLength(64);
    expect(hashOpaqueToken(tokenA)).toBe(hashOpaqueToken(tokenA));
  });
});
