import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

function getIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/notes\/([^/?]+)\/tags/);
  return match ? match[1] : null;
}

export const POST = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const id = getIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Check if association already exists
    const existing = await db.noteTag.findUnique({
      where: {
        noteId_tagId: {
          noteId: id,
          tagId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Tag already added to note' }, { status: 400 });
    }

    await db.noteTag.create({
      data: {
        noteId: id,
        tagId,
      },
    });

    // Return updated note with optimized select
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
    console.error('Error adding tag to note:', error);
    return NextResponse.json({ error: 'Failed to add tag to note' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const url = new URL(request.url);
    const id = getIdFromUrl(request.url);
    const tagId = url.searchParams.get('tagId');

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Use deleteMany to avoid error if record doesn't exist (handles race conditions)
    await db.noteTag.deleteMany({
      where: {
        noteId: id,
        tagId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing tag from note:', error);
    return NextResponse.json({ error: 'Failed to remove tag from note' }, { status: 500 });
  }
});
