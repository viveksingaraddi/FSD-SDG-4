/**
 * Database client for FSD-SDG-4.
 *
 * The client comes from the Composer service declaration (`service.mts`):
 * `service.load()` hydrates the `db` dependency the app root wires — a Prisma
 * ORM 8 client built from the emitted data contract — and memoizes it, so the
 * client is constructed exactly once per process. The first access may be
 * deferred (it hydrates the binding on demand), so importing this module never
 * requires the platform environment.
 */

import service from '../../service.mjs';

type ApiDb = ReturnType<typeof service.load>['db'];

let binding: ApiDb | undefined;

function getDb(): ApiDb {
  binding ??= service.load().db;
  return binding;
}

/** Prisma ORM 8 client over the app's data contract. */
export function getDbClient(): ReturnType<ApiDb['clientWith']> {
  return getDb().client;
}

/** ORM lane over the app's data contract: `prisma.orm.public.<Model>`. */
export const prisma = {
  get orm() {
    return getDbClient().orm;
  },
  get client() {
    return getDbClient();
  },
};
