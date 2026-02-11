import { NextResponse } from 'next/server';
import { requireAuthOrCron } from '@/lib/api-auth';

/**
 * Test endpoint to verify cron authentication is working
 * Call this from Vercel cron or manually with Authorization header
 */
export const GET = async (request: Request) => {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    const allHeaders = Object.fromEntries(request.headers.entries());
    
    const auth = await requireAuthOrCron(request);
    
    return NextResponse.json({
      success: true,
      authType: auth.type,
      hasCronSecret: !!cronSecret,
      cronSecretLength: cronSecret?.length || 0,
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader?.length || 0,
      authHeaderPrefix: authHeader ? `${authHeader.substring(0, 30)}...` : null,
      expectedPrefix: cronSecret ? `Bearer ${cronSecret.substring(0, 10)}...` : null,
      headersMatch: cronSecret && authHeader === `Bearer ${cronSecret}`,
      allHeaders: Object.keys(allHeaders).filter(k => k.toLowerCase().includes('auth')),
      timestamp: new Date().toISOString(),
      message: auth.type === 'cron' 
        ? 'Cron authentication successful!' 
        : 'Session authentication successful',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: errorStack,
        hasCronSecret: !!process.env.CRON_SECRET,
        cronSecretLength: process.env.CRON_SECRET?.length || 0,
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }
};
