import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Find Secret Wars collection
    const collection = await db.collection.findFirst({
      where: { name: 'Secret Wars' },
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Secret Wars collection not found. Please seed it first.' },
        { status: 404 }
      );
    }

    // Update the collection with the image URL
    const updatedCollection = await db.collection.update({
      where: { id: collection.id },
      data: {
        imageUrl,
      },
    });

    return NextResponse.json({ 
      success: true,
      collection: updatedCollection,
      message: 'Secret Wars collection image updated successfully'
    });
  } catch (error) {
    console.error('Error setting Secret Wars collection image:', error);
    return NextResponse.json(
      { error: 'Failed to set collection image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});
