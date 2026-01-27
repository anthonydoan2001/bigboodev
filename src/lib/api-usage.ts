/**
 * API Usage Tracking Utility
 * Tracks API requests for rate limit monitoring
 */

import { db } from './db';

export type ApiName = 
  | 'finnhub' 
  | 'coinmarketcap' 
  | 'rawg' 
  | 'tmdb' 
  | 'jikan' 
  | 'espn' 
  | 'openweather';

export interface ApiLimit {
  name: string;
  displayName: string;
  limits: {
    perSecond?: number;
    perMinute?: number;
    perHour?: number;
    perDay?: number;
    perMonth?: number;
  };
}

export const API_LIMITS: Record<ApiName, ApiLimit> = {
  finnhub: {
    name: 'finnhub',
    displayName: 'Finnhub (Stocks)',
    limits: {
      perSecond: 30,
      perMinute: 60,
    },
  },
  coinmarketcap: {
    name: 'coinmarketcap',
    displayName: 'CoinMarketCap (Crypto)',
    limits: {
      perMinute: 30,
      perMonth: 10000, // 10,000 credits/month for free tier
    },
  },
  rawg: {
    name: 'rawg',
    displayName: 'RAWG (Games)',
    limits: {
      perSecond: 5,
    },
  },
  tmdb: {
    name: 'tmdb',
    displayName: 'TMDB (Movies/TV)',
    limits: {
      perSecond: 50,
    },
  },
  jikan: {
    name: 'jikan',
    displayName: 'Jikan (Anime)',
    limits: {
      perSecond: 2,
      perMinute: 30,
    },
  },
  espn: {
    name: 'espn',
    displayName: 'ESPN (Sports)',
    limits: {
      perMinute: 60, // Recommended limit (unofficial)
    },
  },
  openweather: {
    name: 'openweather',
    displayName: 'OpenWeatherMap (Weather)',
    limits: {
      perMinute: 60,
      perDay: 1000, // Free tier daily limit
    },
  },
};

/**
 * Track an API request
 */
export async function trackApiUsage(
  apiName: ApiName,
  options: {
    endpoint?: string;
    success?: boolean;
    statusCode?: number;
  } = {}
): Promise<void> {
  try {
    // Check if apiUsage model exists in Prisma client
    if (!('apiUsage' in db) || !db.apiUsage) {
      // Silently fail - this is expected if Prisma client hasn't been regenerated
      // or if the migration hasn't been run yet
      return;
    }

    await db.apiUsage.create({
      data: {
        apiName,
        endpoint: options.endpoint,
        success: options.success ?? true,
        statusCode: options.statusCode,
      },
    });
  } catch (error) {
    // Don't throw - tracking failures shouldn't break the app
    // Only log if it's not a missing model error
    if (error instanceof Error && !error.message.includes('undefined')) {
      console.error(`Failed to track API usage for ${apiName}:`, error);
    }
  }
}

/**
 * Get API usage statistics for a time period
 */
export async function getApiUsageStats(
  apiName: ApiName,
  period: 'minute' | 'hour' | 'day' | 'month' = 'day'
): Promise<{
  count: number;
  successCount: number;
  errorCount: number;
  period: string;
}> {
  const now = new Date();
  let startTime: Date;

  switch (period) {
    case 'minute':
      startTime = new Date(now.getTime() - 60 * 1000);
      break;
    case 'hour':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case 'day':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const usage = await db.apiUsage.findMany({
    where: {
      apiName,
      timestamp: {
        gte: startTime,
      },
    },
  });

  const successCount = usage.filter((u) => u.success).length;
  const errorCount = usage.length - successCount;

  return {
    count: usage.length,
    successCount,
    errorCount,
    period,
  };
}

/**
 * Get all API usage statistics
 */
export async function getAllApiUsageStats(): Promise<
  Record<
    ApiName,
    {
      perSecond?: { count: number; limit?: number };
      perMinute?: { count: number; limit?: number };
      perHour?: { count: number; limit?: number };
      perDay?: { count: number; limit?: number };
      perMonth?: { count: number; limit?: number };
      successCount: number;
      errorCount: number;
    }
  >
> {
  const now = new Date();
  const oneSecondAgo = new Date(now.getTime() - 1000);
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const stats: Record<
    ApiName,
    {
      perSecond?: { count: number; limit?: number };
      perMinute?: { count: number; limit?: number };
      perHour?: { count: number; limit?: number };
      perDay?: { count: number; limit?: number };
      perMonth?: { count: number; limit?: number };
      successCount: number;
      errorCount: number;
    }
  > = {} as Record<string, {
    perSecond?: { count: number; limit?: number };
    perMinute?: { count: number; limit?: number };
    perHour?: { count: number; limit?: number };
    perDay?: { count: number; limit?: number };
    perMonth?: { count: number; limit?: number };
    successCount: number;
    errorCount: number;
  }>;

  for (const apiName of Object.keys(API_LIMITS) as ApiName[]) {
    const limits = API_LIMITS[apiName].limits;

    // Fetch all usage for this API
    const allUsage = await db.apiUsage.findMany({
      where: {
        apiName,
        timestamp: {
          gte: oneMonthAgo,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const successCount = allUsage.filter((u) => u.success).length;
    const errorCount = allUsage.length - successCount;

    // Calculate counts for each period
    const perSecondCount = allUsage.filter(
      (u) => u.timestamp >= oneSecondAgo
    ).length;
    const perMinuteCount = allUsage.filter(
      (u) => u.timestamp >= oneMinuteAgo
    ).length;
    const perHourCount = allUsage.filter(
      (u) => u.timestamp >= oneHourAgo
    ).length;
    const perDayCount = allUsage.filter(
      (u) => u.timestamp >= oneDayAgo
    ).length;
    const perMonthCount = allUsage.length;

    stats[apiName] = {
      perSecond: limits.perSecond
        ? { count: perSecondCount, limit: limits.perSecond }
        : undefined,
      perMinute: limits.perMinute
        ? { count: perMinuteCount, limit: limits.perMinute }
        : undefined,
      perHour: limits.perHour
        ? { count: perHourCount, limit: limits.perHour }
        : undefined,
      perDay: limits.perDay
        ? { count: perDayCount, limit: limits.perDay }
        : undefined,
      perMonth: limits.perMonth
        ? { count: perMonthCount, limit: limits.perMonth }
        : undefined,
      successCount,
      errorCount,
    };
  }

  return stats;
}
