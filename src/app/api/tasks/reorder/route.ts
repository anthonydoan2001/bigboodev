import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { TaskStatus } from '@/types/tasks';

export const POST = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const body = await request.json();
    const { taskId, newStatus, newPosition } = body;

    if (!taskId || newStatus === undefined || newPosition === undefined) {
      return NextResponse.json(
        { error: 'taskId, newStatus, and newPosition are required' },
        { status: 400 }
      );
    }

    // Get the task to update
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const oldStatus = task.status as TaskStatus;
    const oldPosition = task.position;

    // If moving to a different status, we need to adjust positions
    if (oldStatus !== newStatus) {
      // Shift down tasks in the old status column that were after the moved task
      await db.task.updateMany({
        where: {
          status: oldStatus,
          position: { gt: oldPosition },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      // Shift up tasks in the new status column that are at or after the new position
      await db.task.updateMany({
        where: {
          status: newStatus as TaskStatus,
          position: { gte: newPosition },
        },
        data: {
          position: { increment: 1 },
        },
      });
    } else {
      // Same column, just reordering
      if (oldPosition < newPosition) {
        // Moving down: shift items between old and new positions up
        await db.task.updateMany({
          where: {
            status: oldStatus,
            position: { gt: oldPosition, lte: newPosition },
          },
          data: {
            position: { decrement: 1 },
          },
        });
      } else if (oldPosition > newPosition) {
        // Moving up: shift items between new and old positions down
        await db.task.updateMany({
          where: {
            status: oldStatus,
            position: { gte: newPosition, lt: oldPosition },
          },
          data: {
            position: { increment: 1 },
          },
        });
      }
    }

    // Update the task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        status: newStatus as TaskStatus,
        position: newPosition,
      },
      include: {
        taskNotes: {
          include: {
            note: true,
          },
        },
      },
    });

    return NextResponse.json({ item: updatedTask });
  } catch (error) {
    console.error('Error reordering task:', error);
    return NextResponse.json({ error: 'Failed to reorder task' }, { status: 500 });
  }
});
