import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { env } from '../config/env.js';

const softDeleteScopedOps = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany',
]);

const adapter = new PrismaPg({
  connectionString: env.databaseUrl,
});

const basePrisma = new PrismaClient({
  adapter,
  log: env.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const prismaRaw = basePrisma;

export const prisma = basePrisma.$extends({
  query: {
    user: {
      async $allOperations({ operation, args, query }) {
        if (!softDeleteScopedOps.has(operation)) {
          return query(args);
        }

        const rawArgs = (args ?? {}) as Record<string, unknown>;
        const includeDeleted = rawArgs.includeDeleted === true;
        delete rawArgs.includeDeleted;

        if (includeDeleted) {
          return query(rawArgs);
        }

        const where = (rawArgs.where ?? {}) as Record<string, unknown>;
        return query({
          ...rawArgs,
          where: {
            ...where,
            deletedAt: null,
          },
        } as never);
      },
    },
  },
});

type ExtendedPrismaClient = typeof prisma;
const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient;
};

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

export const db = globalForPrisma.prisma;

if (env.nodeEnv !== 'production') {
  globalForPrisma.prisma = db;
}

export const client = db;
