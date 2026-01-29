import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { invalidateCache, CACHE_KEYS } from '@/lib/cache';

function getIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/folders\/([^/?]+)/);
  return match ? match[1] : null;
}

// Calculate folder depth
async function getFolderDepth(folderId: string | null): Promise<number> {
  if (!folderId) return 0;

  let depth = 0;
  let currentId: string | null = folderId;

  while (currentId) {
    const folderResult: { parentId: string | null } | null = await db.folder.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    if (!folderResult) break;
    depth++;
    currentId = folderResult.parentId;
  }

  return depth;
}

// Check if moving folder would create a cycle
async function wouldCreateCycle(folderId: string, newParentId: string): Promise<boolean> {
  let currentId: string | null = newParentId;

  while (currentId) {
    if (currentId === folderId) return true;
    const folderResult: { parentId: string | null } | null = await db.folder.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    if (!folderResult) break;
    currentId = folderResult.parentId;
  }

  return false;
}

export const PATCH = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const id = getIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, parentId, isPinned } = body;

    const updateData: { name?: string; parentId?: string | null; isPinned?: boolean } = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: 'Folder name cannot be empty' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (parentId !== undefined) {
      // Validate not setting parent to self
      if (parentId === id) {
        return NextResponse.json({ error: 'Folder cannot be its own parent' }, { status: 400 });
      }

      // Check for cycle
      if (parentId && (await wouldCreateCycle(id, parentId))) {
        return NextResponse.json({ error: 'Moving folder would create a cycle' }, { status: 400 });
      }

      // Validate max nesting depth
      if (parentId) {
        const parentDepth = await getFolderDepth(parentId);
        const _folder = await db.folder.findUnique({
          where: { id },
          include: { children: true },
        });

        // Calculate the max depth of descendants
        const getMaxChildDepth = async (folderId: string): Promise<number> => {
          const children = await db.folder.findMany({
            where: { parentId: folderId },
          });
          if (children.length === 0) return 0;
          const depths = await Promise.all(
            children.map(async (child) => 1 + (await getMaxChildDepth(child.id)))
          );
          return Math.max(...depths);
        };

        const childDepth = await getMaxChildDepth(id);
        if (parentDepth + 1 + childDepth > 2) {
          return NextResponse.json(
            { error: 'Moving folder would exceed maximum nesting depth (3 levels)' },
            { status: 400 }
          );
        }
      }

      updateData.parentId = parentId || null;
    }

    if (isPinned !== undefined) {
      updateData.isPinned = isPinned;
    }

    const folder = await db.folder.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });

    // Invalidate folders cache
    invalidateCache(CACHE_KEYS.FOLDERS);

    return NextResponse.json({ item: folder });
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const id = getIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Get folder with notes and children count
    const folder = await db.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: { notes: true, children: true },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Move notes to parent folder (or root if no parent)
    await db.note.updateMany({
      where: { folderId: id },
      data: { folderId: folder.parentId },
    });

    // Move child folders to parent
    await db.folder.updateMany({
      where: { parentId: id },
      data: { parentId: folder.parentId },
    });

    // Delete the folder
    await db.folder.delete({
      where: { id },
    });

    // Invalidate folders cache
    invalidateCache(CACHE_KEYS.FOLDERS);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
});
