import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';

/**
 * Setup route is deprecated - use /api/crypto/refresh instead
 * This route now redirects to the refresh endpoint
 */
export const GET = withAuth(async () => {
  return NextResponse.json({
    success: false,
    message: 'This endpoint is deprecated. Use /api/crypto/refresh instead.',
    redirect: '/api/crypto/refresh',
  }, { status: 410 });
});
