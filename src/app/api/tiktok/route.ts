import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { shuffleArray, getTodaySeed } from '@/lib/tiktok-utils';

const ITEMS_PER_PAGE = 12;

// DELETE - Remove a video by ID
export const DELETE = withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    await db.tikTokVideo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting TikTok video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Build where clause for filtering
    const whereClause: {
      likedAt?: {
        gte: Date;
        lt: Date;
      };
    } = {};

    if (month !== null && year !== null) {
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (!isNaN(monthNum) && !isNaN(yearNum)) {
        // Filter by month/year based on likedAt
        const startDate = new Date(yearNum, monthNum, 1);
        const endDate = new Date(yearNum, monthNum + 1, 1);

        whereClause.likedAt = {
          gte: startDate,
          lt: endDate,
        };
      }
    }

    // Fetch all matching videos for shuffling
    const allVideos = await db.tikTokVideo.findMany({
      where: whereClause,
      orderBy: { likedAt: 'desc' },
    });

    // Get today's seed for consistent daily randomization
    const seed = getTodaySeed();

    // Shuffle the videos using seeded random
    const shuffledVideos = shuffleArray(allVideos, seed);

    // Calculate pagination
    const totalCount = shuffledVideos.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const paginatedVideos = shuffledVideos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return NextResponse.json({
      videos: paginatedVideos,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error('Error fetching TikTok videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TikTok videos' },
      { status: 500 }
    );
  }
});

// Also support fetching available months for the filter dropdown
export const POST = withAuth(async () => {
  try {
    // Get distinct months from all videos
    const videos = await db.tikTokVideo.findMany({
      select: { likedAt: true },
      orderBy: { likedAt: 'desc' },
    });

    // Build unique month/year options
    const uniqueMonths = new Map<string, { label: string; month: number; year: number }>();

    videos.forEach(video => {
      const date = new Date(video.likedAt);
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${month}`;

      if (!uniqueMonths.has(key)) {
        uniqueMonths.set(key, {
          label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          month,
          year,
        });
      }
    });

    // Convert to array and sort descending
    const months = Array.from(uniqueMonths.entries())
      .map(([value, data]) => ({ value, ...data }))
      .sort((a, b) => b.year - a.year || b.month - a.month);

    return NextResponse.json({ months });
  } catch (error) {
    console.error('Error fetching TikTok months:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TikTok months' },
      { status: 500 }
    );
  }
});
