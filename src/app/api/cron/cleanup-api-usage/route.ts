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

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for cleanup

export async function GET(request: Request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET) {
    console.warn('⚠️  CRON_SECRET not set in environment variables');
  }

  if (authHeader !== expectedAuth) {
    console.error('Unauthorized cleanup attempt');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();

  try {
    console.log('🧹 Starting API usage cleanup...');

    // Get storage stats before cleanup
    const beforeStats = await getStorageStats();
    console.log('📊 Before cleanup:', beforeStats);

    // Step 1: Aggregate recent hourly data
    console.log('📈 Aggregating recent hourly data...');
    const hoursAggregated = await aggregateRecentHourly();
    console.log(`✅ Aggregated ${hoursAggregated} hours`);

    // Step 2: Cleanup old records (older than 90 days)
    console.log('🗑️  Cleaning up old records (>90 days)...');
    const { aggregatedDays, deletedRecords } = await cleanupOldApiUsage(90);

    // Get storage stats after cleanup
    const afterStats = await getStorageStats();
    console.log('📊 After cleanup:', afterStats);

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

    console.log('✨ Cleanup complete:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger (for testing)
 * POST /api/cron/cleanup-api-usage
 */
export async function POST(request: Request) {
  // Same as GET but allows manual triggering
  return GET(request);
}
