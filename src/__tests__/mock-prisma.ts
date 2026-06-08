import { vi, beforeEach } from 'vitest';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

// Import the original Prisma extended client
import { prisma } from '../db/index.js';

// Deep mock the module
vi.mock('../db/index.js', () => ({
  __esModule: true,
  prisma: mockDeep(),
  db: mockDeep(),
  client: mockDeep(),
  prismaRaw: mockDeep(),
}));

// Export the mocked version so tests can use it
export const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;
import { prismaRaw } from '../db/index.js';
export const prismaRawMock = prismaRaw as unknown as DeepMockProxy<typeof prismaRaw>;

// Reset mocks between tests
beforeEach(() => {
  mockReset(prismaMock);
  mockReset(prismaRawMock);
});
