import { NextResponse } from 'next/server';
import { withAuthOrCron } from '@/lib/api-auth';

/**
 * Test endpoint to verify cron authentication is working
 * Call this from Vercel cron or manually with Authorization header
 */
export const GET = withAuthOrCron(async (_request: Request, auth: { type: 'session' | 'cron'; token: string }) => {
  return NextResponse.json({
    success: true,
    authType: auth.type,
    timestamp: new Date().toISOString(),
    message: auth.type === 'cron'
      ? 'Cron authentication successful!'
      : 'Session authentication successful',
  });
});
