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

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const collection = await db.collection.update({
      where: { id: collectionId },
      data: {
        imageUrl,
      },
    });

    return NextResponse.json({ collection });
  } catch (error) {
    console.error('Error setting collection image:', error);
    return NextResponse.json(
      { error: 'Failed to set collection image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});
