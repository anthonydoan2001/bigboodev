import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { BookmarkFolderTreeNode, BookmarkFolderWithChildren } from '@/types/bookmarks';

// Build tree structure from flat list
function buildFolderTree(folders: BookmarkFolderWithChildren[]): BookmarkFolderTreeNode[] {
  const folderMap = new Map<string, BookmarkFolderTreeNode>();
  const roots: BookmarkFolderTreeNode[] = [];

  // Create nodes
  folders.forEach((folder) => {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      sectionId: folder.sectionId ?? null,
      children: [],
      bookmarkCount: folder._count?.bookmarks || 0,
      isPinned: folder.isPinned ?? false,
      position: folder.position ?? 0,
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

  // Sort roots by position
  roots.sort((a, b) => a.position - b.position);

  return roots;
}

// Calculate folder depth
async function getFolderDepth(folderId: string | null): Promise<number> {
  if (!folderId) return 0;

  let depth = 0;
  let currentId: string | null = folderId;

  while (currentId) {
    const folderResult: { parentId: string | null } | null = await db.bookmarkFolder.findUnique({
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
    const folders = await db.bookmarkFolder.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
        sectionId: true,
        isPinned: true,
        position: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookmarks: true,
          },
        },
      },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });

    const tree = buildFolderTree(folders as BookmarkFolderWithChildren[]);
    const response = { items: folders, tree };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching bookmark folders:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmark folders' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const body = await request.json();
    const { name, parentId, sectionId } = body;

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

    // Auto-assign position at end of section/unsectioned group
    const maxPosition = await db.bookmarkFolder.aggregate({
      _max: { position: true },
      where: {
        sectionId: sectionId || null,
        parentId: parentId || null,
      },
    });

    const folder = await db.bookmarkFolder.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        sectionId: sectionId || null,
        position: (maxPosition._max.position ?? -1) + 1,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        isPinned: true,
        position: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { bookmarks: true },
        },
      },
    });

    return NextResponse.json({ item: folder });
  } catch (error) {
    console.error('Error creating bookmark folder:', error);
    return NextResponse.json(
      {
        error: 'Failed to create bookmark folder',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
