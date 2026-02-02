import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Bookmark ID is required' }, { status: 400 });
    }

    const bookmark = await db.bookmark.findUnique({
      where: { id },
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

    if (!bookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    return NextResponse.json({ item: bookmark });
  } catch (error) {
    console.error('Error fetching bookmark:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmark' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Bookmark ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { url: bookmarkUrl, title, description, faviconUrl, folderId, isPinned } = body;

    const updateData: Record<string, unknown> = {};
    if (bookmarkUrl !== undefined) updateData.url = bookmarkUrl.trim();
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (faviconUrl !== undefined) updateData.faviconUrl = faviconUrl || null;
    if (folderId !== undefined) updateData.folderId = folderId || null;
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    const bookmark = await db.bookmark.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating bookmark:', error);
    return NextResponse.json(
      {
        error: 'Failed to update bookmark',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Bookmark ID is required' }, { status: 400 });
    }

    await db.bookmark.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete bookmark',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
