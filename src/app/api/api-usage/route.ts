import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { getAllApiUsageStats, API_LIMITS } from '@/lib/api-usage';
import { db } from '@/lib/db';

export const GET = withAuth(async (request: Request, sessionToken: string) => {
  try {
    // Check if apiUsage model exists in Prisma client (for debugging)
    if (!('apiUsage' in db)) {
      console.error('Prisma client missing apiUsage model. Please restart dev server after running: npx prisma generate');
      return NextResponse.json({ 
        error: 'Database model not available',
        message: 'Please restart the dev server after running: npx prisma generate',
        hint: 'The Prisma client needs to be regenerated to include the new apiUsage model'
      }, { status: 500 });
    }

    const stats = await getAllApiUsageStats();

    // Format the response with display names and usage percentages
    const formattedStats = Object.entries(stats).map(([apiName, usage]) => {
      const apiInfo = API_LIMITS[apiName as keyof typeof API_LIMITS];
      const limits = apiInfo.limits;

      // Calculate usage percentages for each limit
      const usageDetails: Record<string, any> = {};
      
      if (usage.perSecond) {
        usageDetails.perSecond = {
          ...usage.perSecond,
          percentage: usage.perSecond.limit
            ? Math.round((usage.perSecond.count / usage.perSecond.limit) * 100)
            : 0,
          unit: 'second',
        };
      }
      
      if (usage.perMinute) {
        usageDetails.perMinute = {
          ...usage.perMinute,
          percentage: usage.perMinute.limit
            ? Math.round((usage.perMinute.count / usage.perMinute.limit) * 100)
            : 0,
          unit: 'minute',
        };
      }
      
      if (usage.perHour) {
        usageDetails.perHour = {
          ...usage.perHour,
          percentage: usage.perHour.limit
            ? Math.round((usage.perHour.count / usage.perHour.limit) * 100)
            : 0,
          unit: 'hour',
        };
      }
      
      if (usage.perDay) {
        usageDetails.perDay = {
          ...usage.perDay,
          percentage: usage.perDay.limit
            ? Math.round((usage.perDay.count / usage.perDay.limit) * 100)
            : 0,
          unit: 'day',
        };
      }
      
      if (usage.perMonth) {
        usageDetails.perMonth = {
          ...usage.perMonth,
          percentage: usage.perMonth.limit
            ? Math.round((usage.perMonth.count / usage.perMonth.limit) * 100)
            : 0,
          unit: 'month',
        };
      }

      return {
        apiName,
        displayName: apiInfo.displayName,
        limits: limits,
        usage: usageDetails,
        successCount: usage.successCount,
        errorCount: usage.errorCount,
      };
    });

    return NextResponse.json({ stats: formattedStats });
  } catch (error) {
    console.error('Error fetching API usage stats:', error);
    
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown';
    
    // Check if it's a Prisma model missing error
    if (errorMessage.includes('apiUsage') || errorMessage.includes('Cannot read property') || errorName === 'TypeError') {
      return NextResponse.json(
        { 
          error: 'Prisma client model not found',
          message: 'Please restart the dev server after running: npx prisma generate',
          details: errorMessage,
          hint: 'The Prisma client needs to be regenerated to include the new apiUsage model'
        },
        { status: 500 }
      );
    }
    
    // Check if it's a database error (table doesn't exist)
    if (errorMessage.includes('does not exist') || errorMessage.includes('api_usage')) {
      return NextResponse.json(
        { 
          error: 'Database table not found. Please run the migration: npx prisma migrate deploy',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch API usage statistics',
        message: errorMessage,
        name: errorName,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
});
