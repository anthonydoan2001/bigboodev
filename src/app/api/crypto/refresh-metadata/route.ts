import { NextResponse } from 'next/server';

/**
 * Refresh metadata route is deprecated - use /api/crypto/refresh instead
 * This route now redirects to the refresh endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'This endpoint is deprecated. Use /api/crypto/refresh instead.',
    redirect: '/api/crypto/refresh',
  }, { status: 410 });
}
