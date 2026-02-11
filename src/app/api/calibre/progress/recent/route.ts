import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async () => {
  try {
    const recentProgress = await db.bookReadingProgress.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 6,
    });

    return NextResponse.json({ progress: recentProgress });
  } catch (error) {
    console.error('Error fetching recent reading progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent reading progress' },
      { status: 500 }
    );
  }
});
