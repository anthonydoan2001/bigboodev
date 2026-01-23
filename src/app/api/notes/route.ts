import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const notes = await db.note.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ items: notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const note = await db.note.create({
      data: {
        title: title.trim(),
        content: content?.trim() || '',
      },
    });

    return NextResponse.json({ item: note });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      {
        error: 'Failed to create note',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
