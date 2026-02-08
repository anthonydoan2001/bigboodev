import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export const PATCH = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, position } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (position !== undefined) updateData.position = position;

    const section = await db.bookmarkSection.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ item: section });
  } catch (error) {
    console.error('Error updating bookmark section:', error);
    return NextResponse.json(
      {
        error: 'Failed to update bookmark section',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    // Move folders out of this section (set sectionId to null)
    await db.bookmarkFolder.updateMany({
      where: { sectionId: id },
      data: { sectionId: null },
    });

    await db.bookmarkSection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bookmark section:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete bookmark section',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
