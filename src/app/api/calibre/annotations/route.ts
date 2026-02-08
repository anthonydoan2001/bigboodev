import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

// GET - Fetch annotations or bookmarks for a book
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const bookId = url.searchParams.get('bookId');
    const type = url.searchParams.get('type'); // 'annotation' | 'bookmark'

    if (!bookId) {
      return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
    }

    if (type === 'bookmark') {
      const bookmarks = await db.bookBookmark.findMany({
        where: { bookId },
        orderBy: { progress: 'asc' },
      });
      return NextResponse.json({ bookmarks });
    }

    // Default: annotations
    const annotations = await db.bookAnnotation.findMany({
      where: { bookId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ annotations });
  } catch (error) {
    console.error('Error fetching annotations:', error);
    return NextResponse.json({ error: 'Failed to fetch annotations' }, { status: 500 });
  }
});

// POST - Create annotation or bookmark
export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { type } = body; // 'annotation' | 'bookmark'

    if (type === 'bookmark') {
      const { bookId, cfi, label, chapter, progress } = body;
      if (!bookId || !cfi) {
        return NextResponse.json({ error: 'bookId and cfi are required' }, { status: 400 });
      }

      const bookmark = await db.bookBookmark.create({
        data: {
          bookId,
          cfi,
          label: label || null,
          chapter: chapter || null,
          progress: progress ?? 0,
        },
      });
      return NextResponse.json({ bookmark });
    }

    // Default: annotation
    const { bookId, cfiRange, text, note, color, chapter, annotationType } = body;
    if (!bookId || !cfiRange || !text) {
      return NextResponse.json(
        { error: 'bookId, cfiRange, and text are required' },
        { status: 400 }
      );
    }

    const annotation = await db.bookAnnotation.create({
      data: {
        bookId,
        type: annotationType || 'highlight',
        cfiRange,
        text,
        note: note || null,
        color: color || 'yellow',
        chapter: chapter || null,
      },
    });
    return NextResponse.json({ annotation });
  } catch (error) {
    console.error('Error creating annotation:', error);
    return NextResponse.json({ error: 'Failed to create annotation' }, { status: 500 });
  }
});

// PUT - Update annotation or bookmark
export const PUT = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { id, type } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (type === 'bookmark') {
      const { label } = body;
      const bookmark = await db.bookBookmark.update({
        where: { id },
        data: { label: label ?? null },
      });
      return NextResponse.json({ bookmark });
    }

    // Default: annotation
    const { note, color } = body;
    const data: Record<string, unknown> = {};
    if (note !== undefined) data.note = note || null;
    if (color !== undefined) data.color = color;

    const annotation = await db.bookAnnotation.update({
      where: { id },
      data,
    });
    return NextResponse.json({ annotation });
  } catch (error) {
    console.error('Error updating annotation:', error);
    return NextResponse.json({ error: 'Failed to update annotation' }, { status: 500 });
  }
});

// DELETE - Delete annotation or bookmark
export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type'); // 'annotation' | 'bookmark'

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (type === 'bookmark') {
      await db.bookBookmark.delete({ where: { id } });
    } else {
      await db.bookAnnotation.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting annotation:', error);
    return NextResponse.json({ error: 'Failed to delete annotation' }, { status: 500 });
  }
});
