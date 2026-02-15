/**
 * API Usage Cleanup Cron Job
 *
 * This endpoint should be called daily to:
 * 1. Aggregate old detailed records into summary tables
 * 2. Delete old detailed records (keeping 90 days)
 *
 * Setup with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/cleanup-api-usage",
 *       "schedule": "0 2 * * *"
 *     }
 *   ]
 * }
 *
 * Or call manually:
 * curl -X GET http://localhost:3000/api/cron/cleanup-api-usage \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */

import { NextResponse } from 'next/server';
import { cleanupOldApiUsage, aggregateRecentHourly, getStorageStats } from '@/lib/api-usage-cleanup';
import { withAuthOrCron } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for cleanup

async function handleCleanup(_request: Request, _auth: { type: 'session' | 'cron'; token: string }) {
  const startTime = Date.now();

  try {
    void 0; //('🧹 Starting API usage cleanup...');

    // Get storage stats before cleanup
    const beforeStats = await getStorageStats();
    void 0; //('📊 Before cleanup:', beforeStats);

    // Step 1: Aggregate recent hourly data
    void 0; //('📈 Aggregating recent hourly data...');
    const hoursAggregated = await aggregateRecentHourly();
    void 0; //(`✅ Aggregated ${hoursAggregated} hours`);

    // Step 2: Cleanup old records (older than 90 days)
    void 0; //('🗑️  Cleaning up old records (>90 days)...');
    const { aggregatedDays, deletedRecords } = await cleanupOldApiUsage(90);

    // Get storage stats after cleanup
    const afterStats = await getStorageStats();
    void 0; //('📊 After cleanup:', afterStats);

    const duration = Date.now() - startTime;

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      hourlyAggregated: hoursAggregated,
      dailyAggregated: aggregatedDays,
      recordsDeleted: deletedRecords,
      storage: {
        before: beforeStats,
        after: afterStats,
        saved: {
          records: deletedRecords,
          estimatedMB: (
            parseFloat(beforeStats.estimatedSizeMB) -
            parseFloat(afterStats.estimatedSizeMB)
          ).toFixed(2),
        },
      },
    };

    void 0; //('✨ Cleanup complete:', result);

    return NextResponse.json(result);
  } catch (error) {
    void 0; //('❌ Cleanup failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthOrCron(handleCleanup);

/**
 * Manual trigger (for testing)
 * POST /api/cron/cleanup-api-usage
 */
export const POST = withAuthOrCron(handleCleanup);
