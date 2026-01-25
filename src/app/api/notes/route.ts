import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const folderId = searchParams.get('folderId');
    const tagId = searchParams.get('tagId');
    const isPinned = searchParams.get('isPinned');
    const isDeleted = searchParams.get('isDeleted');
    const limit = searchParams.get('limit');
    const includeContent = searchParams.get('includeContent') === 'true';

    const where: any = {};

    // Handle soft delete filter
    if (isDeleted === 'true') {
      where.isDeleted = true;
    } else {
      // By default, exclude deleted notes
      where.isDeleted = false;
    }

    // Handle folder filter
    if (folderId !== null && folderId !== undefined) {
      if (folderId === 'null' || folderId === '') {
        where.folderId = null;
      } else {
        where.folderId = folderId;
      }
    }

    // Handle tag filter
    if (tagId) {
      where.tags = {
        some: {
          tagId,
        },
      };
    }

    // Handle pinned filter
    if (isPinned === 'true') {
      where.isPinned = true;
    }

    // Handle search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Check if counts are requested (for sidebar)
    const includeCounts = searchParams.get('includeCounts') === 'true';

    // Run queries in parallel for better performance
    const [notes, counts] = await Promise.all([
      // Main notes query - optimized with select
      db.note.findMany({
        where,
        select: {
          id: true,
          title: true,
          // Only include content if explicitly requested or for search preview
          ...(includeContent || search ? { content: true } : {}),
          folderId: true,
          isPinned: true,
          isDeleted: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          // Lightweight folder info
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
          // Tags with minimal data
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
          // Only count attachments and taskNotes, don't load them
          _count: {
            select: {
              attachments: true,
              taskNotes: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { updatedAt: 'desc' },
        ],
        // Default pagination: 100 notes max, unless explicitly requested
        take: limit ? parseInt(limit, 10) : 100,
      }),
      // Counts query - only run if requested
      includeCounts
        ? db.note.groupBy({
            by: ['isDeleted'],
            _count: true,
          })
        : Promise.resolve(null),
    ]);

    // Build response
    const response: any = { items: notes };

    // Add counts if requested
    if (counts) {
      const totalCount = counts.find((c) => !c.isDeleted)?._count || 0;
      const trashedCount = counts.find((c) => c.isDeleted)?._count || 0;
      response.counts = { total: totalCount, trashed: trashedCount };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const body = await request.json();
    const { title, content, folderId, isPinned } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const note = await db.note.create({
      data: {
        title: title.trim(),
        content: content?.trim() || '',
        folderId: folderId || null,
        isPinned: isPinned || false,
      },
      select: {
        id: true,
        title: true,
        content: true,
        folderId: true,
        isPinned: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            attachments: true,
            taskNotes: true,
          },
        },
      },
    });

    return NextResponse.json({ item: note });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      {
        error: 'Failed to create note',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
