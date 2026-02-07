import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

function getIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/notes\/([^/?]+)\/restore/);
  return match ? match[1] : null;
}

export const POST = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const id = getIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const note = await db.note.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
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
    console.error('Error restoring note:', error);
    return NextResponse.json({ error: 'Failed to restore note' }, { status: 500 });
  }
});
