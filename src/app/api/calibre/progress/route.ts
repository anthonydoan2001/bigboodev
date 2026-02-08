import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

// GET - Fetch reading progress
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const bookId = url.searchParams.get('bookId');
    const format = url.searchParams.get('format');

    if (!bookId || !format) {
      return NextResponse.json(
        { error: 'bookId and format are required' },
        { status: 400 }
      );
    }

    const progress = await db.bookReadingProgress.findUnique({
      where: {
        bookId_format: { bookId, format },
      },
    });

    if (!progress) {
      return NextResponse.json({ progress: null });
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching reading progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reading progress' },
      { status: 500 }
    );
  }
});

// PUT - Upsert reading progress
export const PUT = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { bookId, format, position, progress: progressValue } = body;

    if (!bookId || !format || position === undefined || progressValue === undefined) {
      return NextResponse.json(
        { error: 'bookId, format, position, and progress are required' },
        { status: 400 }
      );
    }

    const progress = await db.bookReadingProgress.upsert({
      where: {
        bookId_format: { bookId, format },
      },
      update: {
        position: String(position),
        progress: Number(progressValue),
      },
      create: {
        bookId,
        format,
        position: String(position),
        progress: Number(progressValue),
      },
    });

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('Error saving reading progress:', error);
    return NextResponse.json(
      { error: 'Failed to save reading progress' },
      { status: 500 }
    );
  }
});
