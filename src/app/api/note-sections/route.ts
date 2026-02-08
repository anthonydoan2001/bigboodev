import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (_request: Request, _sessionToken: string) => {
  try {
    const sections = await db.noteSection.findMany({
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ items: sections });
  } catch (error) {
    console.error('Error fetching note sections:', error);
    return NextResponse.json({ error: 'Failed to fetch note sections' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Section name is required' }, { status: 400 });
    }

    const maxPosition = await db.noteSection.aggregate({
      _max: { position: true },
    });

    const section = await db.noteSection.create({
      data: {
        name: name.trim(),
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    return NextResponse.json({ item: section });
  } catch (error) {
    console.error('Error creating note section:', error);
    return NextResponse.json(
      {
        error: 'Failed to create note section',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
