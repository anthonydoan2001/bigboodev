import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export const PATCH = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, parentId, sectionId, isPinned, position } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (sectionId !== undefined) updateData.sectionId = sectionId || null;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (position !== undefined) updateData.position = position;

    const folder = await db.bookmarkFolder.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        parentId: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { bookmarks: true },
        },
      },
    });

    return NextResponse.json({ item: folder });
  } catch (error) {
    console.error('Error updating bookmark folder:', error);
    return NextResponse.json(
      {
        error: 'Failed to update bookmark folder',
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
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
    }

    // Move bookmarks to root (null folderId) before deleting folder
    await db.bookmark.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });

    // Move child folders to root
    await db.bookmarkFolder.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    });

    await db.bookmarkFolder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bookmark folder:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete bookmark folder',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
