import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { invalidateCache, CACHE_KEYS } from '@/lib/cache';

function getIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/tags\/([^/?]+)/);
  return match ? match[1] : null;
}

export const PATCH = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const id = getIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, color } = body;

    const updateData: any = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: 'Tag name cannot be empty' }, { status: 400 });
      }

      // Check for duplicate name (excluding current tag)
      const existing = await db.tag.findFirst({
        where: {
          name: name.trim().toLowerCase(),
          NOT: { id },
        },
      });

      if (existing) {
        return NextResponse.json({ error: 'Tag with this name already exists' }, { status: 400 });
      }

      updateData.name = name.trim().toLowerCase();
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    const tag = await db.tag.update({
      where: { id },
      data: updateData,
    });

    // Invalidate tags cache
    invalidateCache(CACHE_KEYS.TAGS);

    return NextResponse.json({ item: tag });
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const id = getIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Delete the tag (cascades to noteTag associations)
    await db.tag.delete({
      where: { id },
    });

    // Invalidate tags cache
    invalidateCache(CACHE_KEYS.TAGS);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
});
