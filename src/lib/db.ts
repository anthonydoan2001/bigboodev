import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Verify topItem model is available (for debugging)
if (process.env.NODE_ENV === 'development' && !('topItem' in db)) {
  console.warn('⚠️  Prisma client missing topItem model. Please restart the dev server after running: npx prisma generate');
}




