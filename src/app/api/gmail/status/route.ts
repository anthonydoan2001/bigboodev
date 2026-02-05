import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async () => {
  try {
    const token = await db.gmailToken.findFirst({
      select: {
        email: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (!token) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      email: token.email,
      connectedAt: token.createdAt.toISOString(),
      tokenExpired: token.expiresAt < new Date(),
    });
  } catch (error) {
    console.error('Error fetching Gmail status:', error);
    return NextResponse.json({ connected: false });
  }
});
