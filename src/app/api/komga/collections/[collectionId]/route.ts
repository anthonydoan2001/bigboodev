import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

export const GET = withAuth(async (request: NextRequest) => {
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

    const collection = await db.collection.findUnique({
      where: { id: collectionId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Debug: log the collection data being returned
    console.log('API returning collection:', {
      id: collection.id,
      name: collection.name,
      imageUrl: collection.imageUrl,
      hasImageUrl: 'imageUrl' in collection
    });

    return NextResponse.json({ collection });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (request: NextRequest) => {
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

    const body = await request.json();
    const { imageUrl } = body;

    const collection = await db.collection.update({
      where: { id: collectionId },
      data: {
        imageUrl: imageUrl || null,
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ collection });
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json(
      { error: 'Failed to update collection', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});
