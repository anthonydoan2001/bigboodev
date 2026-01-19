import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const collectionIndex = pathParts.indexOf('collections');
    const collectionId = pathParts[collectionIndex + 1];

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    // Verify collection exists
    const collection = await db.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items must be an array' },
        { status: 400 }
      );
    }

    // Create all items
    const createdItems = await Promise.all(
      items.map((item: { seriesId?: string; bookId?: string; phase?: string; order: number }) => {
        if (!item.order && item.order !== 0) {
          throw new Error('Order is required for each item');
        }
        if (!item.seriesId && !item.bookId) {
          throw new Error('Either seriesId or bookId is required');
        }

        return db.collectionItem.create({
          data: {
            collectionId,
            seriesId: item.seriesId || null,
            bookId: item.bookId || null,
            phase: item.phase || null,
            order: item.order,
          },
        });
      })
    );

    return NextResponse.json({ items: createdItems }, { status: 201 });
  } catch (error) {
    console.error('Error adding collection items:', error);
    return NextResponse.json(
      { error: 'Failed to add collection items', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});
