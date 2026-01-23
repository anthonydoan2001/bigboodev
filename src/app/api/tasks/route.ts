import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { TaskStatus, TaskPriority } from '@/types/tasks';

export const GET = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    const where: any = {};

    if (status) {
      const statuses = status.split(',') as TaskStatus[];
      where.status = { in: statuses };
    }

    if (category) {
      where.category = category;
    }

    if (priority) {
      const priorities = priority.split(',') as TaskPriority[];
      where.priority = { in: priorities };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        note: true,
      },
      orderBy: [
        { status: 'asc' },
        { position: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ items: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tasks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const body = await request.json();
    const { title, description, status, priority, dueDate, category, notes, noteId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get max position for the status
    const maxPositionTask = await db.task.findFirst({
      where: { status: (status || 'TODO') as TaskStatus },
      orderBy: { position: 'desc' },
    });

    const newPosition = maxPositionTask ? maxPositionTask.position + 1 : 0;

    const task = await db.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: (status || 'TODO') as TaskStatus,
        priority: (priority || 'MEDIUM') as TaskPriority,
        dueDate: dueDate ? new Date(dueDate) : null,
        category: category?.trim() || null,
        notes: notes?.trim() || null,
        noteId: noteId || null,
        position: newPosition,
      },
      include: {
        note: true,
      },
    });

    return NextResponse.json({ item: task });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      {
        error: 'Failed to create task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
