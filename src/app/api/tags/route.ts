import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { getCache, setCache, invalidateCache, CACHE_KEYS } from '@/lib/cache';

export const GET = withAuth(async (request: Request, sessionToken: string) => {
  try {
    // Check cache first (disabled for debugging)
    // const cached = getCache<{ items: any[] }>(CACHE_KEYS.TAGS);
    // if (cached) {
    //   return NextResponse.json(cached);
    // }

    // Optimized: use select, only count notes that aren't deleted
    const tags = await db.tag.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        createdAt: true,
        _count: {
          select: {
            notes: {
              where: {
                note: { isDeleted: false },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const response = { items: tags };

    // Cache for 60 seconds (disabled for debugging)
    // setCache(CACHE_KEYS.TAGS, response, 60000);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    // Check for duplicate name
    const existing = await db.tag.findUnique({
      where: { name: name.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'Tag with this name already exists' }, { status: 400 });
    }

    const tag = await db.tag.create({
      data: {
        name: name.trim().toLowerCase(),
        color: color || '#6366f1',
      },
    });

    // Invalidate tags cache
    invalidateCache(CACHE_KEYS.TAGS);

    return NextResponse.json({ item: tag });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      {
        error: 'Failed to create tag',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
