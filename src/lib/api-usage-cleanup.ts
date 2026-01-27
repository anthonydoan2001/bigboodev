/**
 * API Usage Data Cleanup & Aggregation
 *
 * This should be run as a cron job to:
 * 1. Aggregate old detailed records into summary tables
 * 2. Delete old detailed records to keep database size manageable
 *
 * Recommended schedule: Daily at 2am
 *
 * Setup with Vercel Cron:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/cleanup-api-usage",
 *        "schedule": "0 2 * * *"
 *      }]
 *    }
 *
 * 2. Create endpoint: /api/cron/cleanup-api-usage/route.ts
 */

import { db } from './db';
import { API_LIMITS, ApiName } from './api-usage';

/**
 * Cleanup old API usage records
 * Aggregates data before deletion to preserve statistics
 */
export async function cleanupOldApiUsage(retentionDays: number = 90): Promise<{
  aggregatedDays: number;
  deletedRecords: number;
}> {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  console.log(`Starting API usage cleanup (retention: ${retentionDays} days)`);
  console.log(`Cutoff date: ${cutoffDate.toISOString()}`);

  try {
    // Step 1: Aggregate old records before deletion
    const aggregatedDays = await aggregateOldRecords(cutoffDate);

    // Step 2: Delete old records
    const result = await db.apiUsage.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    console.log(`✅ Cleanup complete:`);
    console.log(`   - Aggregated: ${aggregatedDays} days`);
    console.log(`   - Deleted: ${result.count} records`);

    return {
      aggregatedDays,
      deletedRecords: result.count,
    };
  } catch (error) {
    console.error('❌ Failed to cleanup API usage:', error);
    throw error;
  }
}

/**
 * Aggregate old records into daily summaries
 */
async function aggregateOldRecords(beforeDate: Date): Promise<number> {
  const apiNames = Object.keys(API_LIMITS) as ApiName[];
  let daysAggregated = 0;

  for (const apiName of apiNames) {
    // Find the date range of unaggregated records
    const oldest = await db.apiUsage.findFirst({
      where: {
        apiName,
        timestamp: { lt: beforeDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (!oldest) continue;

    // Get all unique dates that need aggregation
    const dates = await db.apiUsage.groupBy({
      by: ['timestamp'],
      where: {
        apiName,
        timestamp: { lt: beforeDate },
      },
      _count: true,
    });

    // Group by day
    const dayMap = new Map<string, Date[]>();
    dates.forEach(({ timestamp }) => {
      const day = timestamp.toISOString().split('T')[0];
      if (!dayMap.has(day)) {
        dayMap.set(day, []);
      }
      dayMap.get(day)!.push(timestamp);
    });

    // Aggregate each day
    for (const [dayStr, _timestamps] of dayMap.entries()) {
      const startOfDay = new Date(dayStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      // Check if this day is already aggregated
      const existing = await db.apiUsageAggregate.findUnique({
        where: {
          apiName_aggregationType_periodStart: {
            apiName,
            aggregationType: 'DAILY',
            periodStart: startOfDay,
          },
        },
      });

      if (existing) {
        continue; // Skip if already aggregated
      }

      // Fetch all records for this day
      const records = await db.apiUsage.findMany({
        where: {
          apiName,
          timestamp: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      if (records.length === 0) continue;

      // Calculate aggregations
      const successCount = records.filter(r => r.success).length;
      const errorCount = records.length - successCount;
      const cachedCount = records.filter(r => r.cached).length;

      const responseTimes = records
        .map(r => r.responseTime)
        .filter((rt): rt is number => rt !== null);

      const rateLimitErrors = records.filter(r => r.errorType === 'RATE_LIMIT').length;
      const timeoutErrors = records.filter(r => r.errorType === 'TIMEOUT').length;
      const serverErrors = records.filter(
        r => r.errorType === 'SERVER_ERROR' || (r.statusCode && r.statusCode >= 500)
      ).length;

      const totalCost = records.reduce((sum, r) => sum + (r.costCredits || 0), 0);

      // Create aggregate record
      await db.apiUsageAggregate.create({
        data: {
          apiName,
          aggregationType: 'DAILY',
          periodStart: startOfDay,
          periodEnd: endOfDay,
          totalRequests: records.length,
          successCount,
          errorCount,
          cachedCount,
          avgResponseTime:
            responseTimes.length > 0
              ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
              : null,
          maxResponseTime:
            responseTimes.length > 0 ? Math.max(...responseTimes) : null,
          minResponseTime:
            responseTimes.length > 0 ? Math.min(...responseTimes) : null,
          rateLimitErrors,
          timeoutErrors,
          serverErrors,
          totalCost,
        },
      });

      daysAggregated++;
    }
  }

  return daysAggregated;
}

/**
 * Create hourly aggregates for the past 24 hours
 * This should run more frequently (e.g., every hour)
 */
export async function aggregateRecentHourly(): Promise<number> {
  const apiNames = Object.keys(API_LIMITS) as ApiName[];
  const now = new Date();
  let hoursAggregated = 0;

  // Aggregate the past 24 hours
  for (let i = 0; i < 24; i++) {
    const hourStart = new Date(now);
    hourStart.setHours(now.getHours() - i, 0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourEnd.getHours() + 1);

    for (const apiName of apiNames) {
      // Check if already aggregated
      const existing = await db.apiUsageAggregate.findUnique({
        where: {
          apiName_aggregationType_periodStart: {
            apiName,
            aggregationType: 'HOURLY',
            periodStart: hourStart,
          },
        },
      });

      if (existing) continue;

      // Fetch records for this hour
      const records = await db.apiUsage.findMany({
        where: {
          apiName,
          timestamp: {
            gte: hourStart,
            lt: hourEnd,
          },
        },
      });

      if (records.length === 0) continue;

      // Calculate stats (same as daily aggregation)
      const successCount = records.filter(r => r.success).length;
      const errorCount = records.length - successCount;
      const cachedCount = records.filter(r => r.cached).length;

      const responseTimes = records
        .map(r => r.responseTime)
        .filter((rt): rt is number => rt !== null);

      await db.apiUsageAggregate.create({
        data: {
          apiName,
          aggregationType: 'HOURLY',
          periodStart: hourStart,
          periodEnd: hourEnd,
          totalRequests: records.length,
          successCount,
          errorCount,
          cachedCount,
          avgResponseTime:
            responseTimes.length > 0
              ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
              : null,
          maxResponseTime:
            responseTimes.length > 0 ? Math.max(...responseTimes) : null,
          minResponseTime:
            responseTimes.length > 0 ? Math.min(...responseTimes) : null,
          rateLimitErrors: records.filter(r => r.errorType === 'RATE_LIMIT').length,
          timeoutErrors: records.filter(r => r.errorType === 'TIMEOUT').length,
          serverErrors: records.filter(
            r => r.errorType === 'SERVER_ERROR' || (r.statusCode && r.statusCode >= 500)
          ).length,
          totalCost: records.reduce((sum, r) => sum + (r.costCredits || 0), 0),
        },
      });

      hoursAggregated++;
    }
  }

  return hoursAggregated;
}

/**
 * Get storage statistics
 */
export async function getStorageStats() {
  const detailedCount = await db.apiUsage.count();
  const aggregateCount = await db.apiUsageAggregate.count();

  // Get oldest and newest records
  const oldest = await db.apiUsage.findFirst({
    orderBy: { timestamp: 'asc' },
  });

  const newest = await db.apiUsage.findFirst({
    orderBy: { timestamp: 'desc' },
  });

  // Estimate storage size (rough calculation)
  const avgRecordSize = 500; // bytes (estimated)
  const estimatedSize = detailedCount * avgRecordSize;

  return {
    detailedRecords: detailedCount,
    aggregateRecords: aggregateCount,
    oldestRecord: oldest?.timestamp,
    newestRecord: newest?.timestamp,
    estimatedSizeMB: (estimatedSize / 1024 / 1024).toFixed(2),
  };
}
