import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { FolderTreeNode, FolderWithChildren } from '@/types/notes';
import { invalidateCache, CACHE_KEYS } from '@/lib/cache';

// Build tree structure from flat list
function buildFolderTree(folders: FolderWithChildren[]): FolderTreeNode[] {
  const folderMap = new Map<string, FolderTreeNode>();
  const roots: FolderTreeNode[] = [];

  // Create nodes
  folders.forEach((folder) => {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      children: [],
      noteCount: folder._count?.notes || 0,
      isPinned: folder.isPinned ?? false,
    });
  });

  // Build tree
  folders.forEach((folder) => {
    const node = folderMap.get(folder.id)!;
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort roots: pinned first, then alphabetical
  roots.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.name.localeCompare(b.name);
  });

  return roots;
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

export const GET = withAuth(async (_request: Request, _sessionToken: string) => {
  try {
    // Check cache first (disabled for debugging)
    // const cached = getCache<{ items: FolderWithChildren[]; tree: FolderTreeNode[] }>(CACHE_KEYS.FOLDERS);
    // if (cached) {
    //   return NextResponse.json(cached);
    // }

    // Optimized: use select instead of include, only count non-deleted notes
    const folders = await db.folder.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            notes: {
              where: { isDeleted: false },
            },
          },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { name: 'asc' }],
    });

    const tree = buildFolderTree(folders as FolderWithChildren[]);
    const response = { items: folders, tree };

    // Cache for 60 seconds (disabled for debugging)
    // setCache(CACHE_KEYS.FOLDERS, response, 60000);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const body = await request.json();
    const { name, parentId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Validate max nesting depth (3 levels)
    if (parentId) {
      const parentDepth = await getFolderDepth(parentId);
      if (parentDepth >= 2) {
        return NextResponse.json(
          { error: 'Maximum folder nesting depth (3 levels) reached' },
          { status: 400 }
        );
      }
    }

    const folder = await db.folder.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { notes: true },
        },
      },
    });

    // Invalidate folders cache
    invalidateCache(CACHE_KEYS.FOLDERS);

    return NextResponse.json({ item: folder });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      {
        error: 'Failed to create folder',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
