import {
  WatchlistStatus as PrismaWatchlistStatus,
  WatchlistType as PrismaWatchlistType,
  WatchlistItem as PrismaWatchlistItem,
} from '@prisma/client';

// Re-export Prisma enums for convenience
export { PrismaWatchlistStatus as WatchlistStatusEnum, PrismaWatchlistType as WatchlistTypeEnum };

// Type aliases for backward compatibility (string literal types)
export type WatchlistType = `${PrismaWatchlistType}`;
export type WatchlistStatus = `${PrismaWatchlistStatus}`;

// Re-export the Prisma model type
export type WatchlistItem = PrismaWatchlistItem;

