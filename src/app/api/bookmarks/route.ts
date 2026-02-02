import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const folderId = searchParams.get('folderId');
    const isPinned = searchParams.get('isPinned');
    const limit = searchParams.get('limit');

    const where: Record<string, unknown> = {};

    // Handle folder filter
    if (folderId !== null && folderId !== undefined) {
      if (folderId === 'null' || folderId === '') {
        where.folderId = null;
      } else {
        where.folderId = folderId;
      }
    }

    // Handle pinned filter
    if (isPinned === 'true') {
      where.isPinned = true;
    }

    // Handle search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Check if counts are requested
    const includeCounts = searchParams.get('includeCounts') === 'true';

    // Run queries in parallel for better performance
    const [bookmarks, totalCount] = await Promise.all([
      // Main bookmarks query
      db.bookmark.findMany({
        where,
        select: {
          id: true,
          url: true,
          title: true,
          description: true,
          faviconUrl: true,
          folderId: true,
          isPinned: true,
          createdAt: true,
          updatedAt: true,
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit ? parseInt(limit, 10) : 100,
      }),
      // Total count query - only run if requested
      includeCounts ? db.bookmark.count() : Promise.resolve(null),
    ]);

    // Build response
    const response: { items: typeof bookmarks; counts?: { total: number } } = { items: bookmarks };

    if (totalCount !== null) {
      response.counts = { total: totalCount };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const body = await request.json();
    const { url, title, description, faviconUrl, folderId, isPinned } = body;

    if (!url || !url.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const bookmark = await db.bookmark.create({
      data: {
        url: url.trim(),
        title: title.trim(),
        description: description?.trim() || null,
        faviconUrl: faviconUrl || null,
        folderId: folderId || null,
        isPinned: isPinned || false,
      },
      select: {
        id: true,
        url: true,
        title: true,
        description: true,
        faviconUrl: true,
        folderId: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ item: bookmark });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      {
        error: 'Failed to create bookmark',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
