/**
 * Prisma ORM 8 configuration for the FSD-SDG-4 API.
 *
 * Reads the existing Prisma 6 `prisma/schema.prisma` as the data contract and
 * emits `src/prisma/contract.json` + `contract.d.ts` beside it. Database
 * commands (`db sign`, `db migrate`, `db verify`) connect through the URL in
 * `DATABASE_URL`, which is passed per command and never committed.
 */
import { definePrismaConfig } from 'prisma/config';
import { defineConfig as ormConfig, prisma7Schema } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: prisma7Schema('prisma/schema.prisma'),
    output: 'src/prisma',
    db: { connection: process.env['DATABASE_URL'] ?? '' },
  }),
});
