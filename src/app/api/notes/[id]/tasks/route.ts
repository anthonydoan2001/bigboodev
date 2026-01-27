import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

function getIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/notes\/([^/?]+)\/tasks/);
  return match ? match[1] : null;
}

export const GET = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const noteId = getIdFromUrl(request.url);

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const taskNotes = await db.taskNote.findMany({
      where: { noteId },
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
            category: true,
          },
        },
      },
    });

    return NextResponse.json({ items: taskNotes });
  } catch (error) {
    console.error('Error fetching linked tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch linked tasks' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const noteId = getIdFromUrl(request.url);

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Task already linked to note' }, { status: 400 });
    }

    await db.taskNote.create({
      data: {
        taskId,
        noteId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error linking task to note:', error);
    return NextResponse.json({ error: 'Failed to link task to note' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const url = new URL(request.url);
    const noteId = getIdFromUrl(request.url);
    const taskId = url.searchParams.get('taskId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await db.taskNote.delete({
      where: {
        taskId_noteId: {
          taskId,
          noteId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking task from note:', error);
    return NextResponse.json({ error: 'Failed to unlink task from note' }, { status: 500 });
  }
});
