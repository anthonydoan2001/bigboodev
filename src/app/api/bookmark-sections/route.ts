import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (_request: Request, _sessionToken: string) => {
  try {
    const sections = await db.bookmarkSection.findMany({
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ items: sections });
  } catch (error) {
    console.error('Error fetching bookmark sections:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmark sections' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Section name is required' }, { status: 400 });
    }

    // Get the highest position to append at end
    const maxPosition = await db.bookmarkSection.aggregate({
      _max: { position: true },
    });

    const section = await db.bookmarkSection.create({
      data: {
        name: name.trim(),
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    return NextResponse.json({ item: section });
  } catch (error) {
    console.error('Error creating bookmark section:', error);
    return NextResponse.json(
      {
        error: 'Failed to create bookmark section',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
