import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

function getIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/notes\/([^/?]+)/);
  return match ? match[1] : null;
}

export const GET = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const id = getIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Optimized query: use select for precise field selection
    // Always include taskNotes for single note view (editor needs it)
    const note = await db.note.findUnique({
      where: { id },
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
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
          },
        },
        taskNotes: {
          select: {
            taskId: true,
            noteId: true,
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ item: note });
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const id = getIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, content, folderId, isPinned } = body;

    const updateData: { title?: string; content?: string; folderId?: string | null; isPinned?: boolean } = {};

    if (title !== undefined) updateData.title = title?.trim() || '';
    if (content !== undefined) updateData.content = content || '';
    if (folderId !== undefined) updateData.folderId = folderId || null;
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    // Optimized update: return only what's needed
    const note = await db.note.update({
      where: { id },
      data: updateData,
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
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
          },
        },
        taskNotes: {
          select: {
            taskId: true,
            noteId: true,
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ item: note });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const id = getIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Soft delete: set isDeleted and deletedAt
    await db.note.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
});
