import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

function getIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/tasks\/([^/?]+)\/notes/);
  return match ? match[1] : null;
}

export const GET = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const taskId = getIdFromUrl(request.url);

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const taskNotes = await db.taskNote.findMany({
      where: { taskId },
      include: {
        note: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ items: taskNotes });
  } catch (error) {
    console.error('Error fetching linked notes:', error);
    return NextResponse.json({ error: 'Failed to fetch linked notes' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const taskId = getIdFromUrl(request.url);

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { noteId } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Check if association already exists
    const existing = await db.taskNote.findUnique({
      where: {
        taskId_noteId: {
          taskId,
          noteId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Note already linked to task' }, { status: 400 });
    }

    await db.taskNote.create({
      data: {
        taskId,
        noteId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error linking note to task:', error);
    return NextResponse.json({ error: 'Failed to link note to task' }, { status: 500 });
  }
});
