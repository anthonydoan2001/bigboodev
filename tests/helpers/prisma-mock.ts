import { vi } from 'vitest';

/**
 * Creates a mock Prisma model with common query methods.
 * Each test configures return values via .mockResolvedValue().
 */
export function createMockModel() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    groupBy: vi.fn().mockResolvedValue([]),
  };
}

/**
 * Creates a complete mock db object matching @/lib/db exports.
 * Usage: vi.mock('@/lib/db', () => ({ db: createMockDb() }))
 */
export function createMockDb() {
  return {
    session: createMockModel(),
    note: createMockModel(),
    task: createMockModel(),
  };
}
