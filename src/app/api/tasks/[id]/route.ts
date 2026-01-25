import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { TaskStatus, TaskPriority } from '@/types/tasks';

function getIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/tasks\/([^/?]+)/);
  return match ? match[1] : null;
}

export const PATCH = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const id = getIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, category, notes, noteId, position } = body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title?.trim() || null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status as TaskStatus;
    if (priority !== undefined) updateData.priority = priority as TaskPriority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (category !== undefined) updateData.category = category?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (position !== undefined) updateData.position = position;

    const task = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        taskNotes: {
          include: {
            note: true,
          },
        },
      },
    });

    return NextResponse.json({ item: task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const id = getIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
});
