/**
 * Composer service declaration for the FSD-SDG-4 API.
 *
 * The runtime imports this file (compiled to `dist/service.mjs` beside the
 * rest of the build) to read its database dependency: `service.load()` is
 * hydrated from the platform environment on Compute and under `prisma dev`.
 * `DATABASE_URL` is never read; the database arrives through the service.
 */
import nodeBuild from '@prisma/composer/node';
import { compute } from '@prisma/composer-prisma-cloud';
import { dataContract, postgres } from '@prisma/composer-prisma-cloud/orm';
import contractJson from './prisma/contract.json' with { type: 'json' };
import type { Contract } from './prisma/contract.js';

export const dbContract = dataContract<Contract>(contractJson);

export default compute({
  name: 'api',
  deps: { db: postgres(dbContract) },
  build: nodeBuild({
    module: import.meta.url,
    dir: '../dist',
    entry: './server.js',
    dependencies: 'external',
  }),
});
