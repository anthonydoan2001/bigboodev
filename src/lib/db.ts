import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Verify models are available (for debugging)
if (process.env.NODE_ENV === 'development') {
  if (!('topItem' in db)) {
    console.warn('⚠️  Prisma client missing topItem model. Please restart the dev server after running: npx prisma generate');
  }
  if (!('apiUsage' in db)) {
    console.warn('⚠️  Prisma client missing apiUsage model. Please restart the dev server after running: npx prisma generate');
  }
  if (!('collection' in db)) {
    console.warn('⚠️  Prisma client missing collection model. Please restart the dev server after running: npx prisma generate');
  }
}




