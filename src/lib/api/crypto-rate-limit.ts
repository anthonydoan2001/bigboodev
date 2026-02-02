/**
 * Proactive rate limit checking for CoinMarketCap API
 * Prevents exceeding monthly limits by checking usage before making calls
 */

import { db } from '@/lib/db';

// CoinMarketCap free tier limits
const MONTHLY_LIMIT = 10000;
const WARNING_THRESHOLD = 0.8; // 80% - warn but continue
const SKIP_THRESHOLD = 0.9;   // 90% - skip refresh to preserve quota

export interface RateLimitStatus {
  shouldSkip: boolean;
  shouldWarn: boolean;
  reason?: string;
  usage: {
    count: number;
    limit: number;
    percentage: number;
    remaining: number;
  };
}

/**
 * Check monthly rate limit status for CoinMarketCap API
 * Returns whether to skip the refresh and current usage stats
 */
export async function checkMonthlyRateLimit(): Promise<RateLimitStatus> {
  try {
    // Check if apiUsage model exists
    if (!('apiUsage' in db) || !db.apiUsage) {
      // Can't check - allow refresh
      return {
        shouldSkip: false,
        shouldWarn: false,
        usage: { count: 0, limit: MONTHLY_LIMIT, percentage: 0, remaining: MONTHLY_LIMIT },
      };
    }

    // Get usage for the current calendar month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyCount = await db.apiUsage.count({
      where: {
        apiName: 'coinmarketcap',
        timestamp: {
          gte: startOfMonth,
        },
      },
    });

    const percentage = monthlyCount / MONTHLY_LIMIT;
    const remaining = MONTHLY_LIMIT - monthlyCount;

    const usage = {
      count: monthlyCount,
      limit: MONTHLY_LIMIT,
      percentage: Math.round(percentage * 100),
      remaining,
    };

    // Check if we should skip to preserve quota
    if (percentage >= SKIP_THRESHOLD) {
      return {
        shouldSkip: true,
        shouldWarn: true,
        reason: `Monthly limit at ${usage.percentage}% (${monthlyCount}/${MONTHLY_LIMIT}). Skipping refresh to preserve quota.`,
        usage,
      };
    }

    // Check if we should warn (but still continue)
    if (percentage >= WARNING_THRESHOLD) {
      return {
        shouldSkip: false,
        shouldWarn: true,
        reason: `Monthly limit approaching: ${usage.percentage}% used (${remaining} calls remaining)`,
        usage,
      };
    }

    return {
      shouldSkip: false,
      shouldWarn: false,
      usage,
    };
  } catch (error) {
    // On error, allow the refresh (don't block on monitoring failures)
    console.error('Failed to check rate limit:', error);
    return {
      shouldSkip: false,
      shouldWarn: false,
      usage: { count: 0, limit: MONTHLY_LIMIT, percentage: 0, remaining: MONTHLY_LIMIT },
    };
  }
}

/**
 * Get detailed rate limit stats for display/debugging
 */
export async function getRateLimitStats(): Promise<{
  monthly: RateLimitStatus['usage'];
  daily: { count: number; average: number };
  projectedMonthly: number;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfMonth = now.getDate();

  // Check if apiUsage model exists
  if (!('apiUsage' in db) || !db.apiUsage) {
    return {
      monthly: { count: 0, limit: MONTHLY_LIMIT, percentage: 0, remaining: MONTHLY_LIMIT },
      daily: { count: 0, average: 0 },
      projectedMonthly: 0,
    };
  }

  const monthlyCount = await db.apiUsage.count({
    where: {
      apiName: 'coinmarketcap',
      timestamp: {
        gte: startOfMonth,
      },
    },
  });

  const dailyAverage = dayOfMonth > 0 ? Math.round(monthlyCount / dayOfMonth) : 0;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedMonthly = dailyAverage * daysInMonth;

  // Get today's count
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayCount = await db.apiUsage.count({
    where: {
      apiName: 'coinmarketcap',
      timestamp: {
        gte: startOfDay,
      },
    },
  });

  return {
    monthly: {
      count: monthlyCount,
      limit: MONTHLY_LIMIT,
      percentage: Math.round((monthlyCount / MONTHLY_LIMIT) * 100),
      remaining: MONTHLY_LIMIT - monthlyCount,
    },
    daily: {
      count: todayCount,
      average: dailyAverage,
    },
    projectedMonthly,
  };
}
