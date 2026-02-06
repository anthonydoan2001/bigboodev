import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { MONTHLY_LIMIT } from '@/lib/api/commodities';

/**
 * API route to get MetalpriceAPI budget stats for the current month
 */
export const GET = withAuth(async () => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();

    // Count successful API calls this month
    let callsUsed = 0;
    try {
      callsUsed = await db.apiUsage.count({
        where: {
          apiName: 'metalpriceapi',
          success: true,
          timestamp: { gte: monthStart },
        },
      });
    } catch {
      // apiUsage table may not exist yet
    }

    const callsRemaining = MONTHLY_LIMIT - callsUsed;
    const dailyAverage = dayOfMonth > 0 ? callsUsed / dayOfMonth : 0;
    const projectedMonthEnd = Math.round(dailyAverage * daysInMonth);

    // Get last refresh timestamp
    let lastRefresh: string | null = null;
    try {
      const latestQuote = await db.commodityQuote.findFirst({
        orderBy: { lastUpdated: 'desc' },
      });
      if (latestQuote) {
        lastRefresh = latestQuote.lastUpdated.toISOString();
      }
    } catch {
      // commodityQuote table may not exist yet
    }

    return NextResponse.json({
      callsUsed,
      callsRemaining,
      dailyAverage: Number(dailyAverage.toFixed(1)),
      projectedMonthEnd,
      lastRefresh,
      monthlyLimit: MONTHLY_LIMIT,
    });
  } catch (error) {
    console.error('Error fetching commodity budget:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch budget stats',
      },
      { status: 500 }
    );
  }
});
