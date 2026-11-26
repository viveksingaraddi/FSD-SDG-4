/**
 * Composer app root for FSD-SDG-4.
 *
 * Provisions the app's Prisma-ORM-typed PostgreSQL database (migrations live
 * in `apps/api/migrations/app`, declared through `apps/api/prisma.config.ts`)
 * and wires it into the API service.
 */
import { appRoot } from '@prisma/composer';
import { postgres } from '@prisma/composer-prisma-cloud/orm';
import apiService, { dbContract } from './apps/api/src/service.mjs';

export default appRoot('fsd-sdg-4', ({ provision }) => {
  const db = provision(
    postgres({
      name: 'db',
      contract: dbContract,
      config: 'apps/api/prisma.config.ts',
    }),
  );

  provision(apiService, { deps: { db } });
});
