import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const items = await db.watchlistItem.findMany({
      orderBy: [
        { type: 'asc' }, // Anime first, then movies, then shows
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received POST body:', body);

    const { externalId, type, title, imageUrl, year, rating, episodes, status } = body;

    // Validate required fields
    if (!externalId || !type || !title) {
      console.error('Missing required fields:', { externalId, type, title });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if item already exists
    const existing = await db.watchlistItem.findUnique({
      where: {
        externalId_type: {
          externalId: String(externalId),
          type: type.toUpperCase(),
        }
      }
    });

    if (existing) {
      // If status is being set to WATCHED or WATCHING, update the existing item
      if (status === 'WATCHED' || status === 'WATCHING') {
        const updated = await db.watchlistItem.update({
          where: { id: existing.id },
          data: { status: status.toUpperCase() }
        });
        return NextResponse.json({ item: updated });
      }
      console.log('Item already exists:', existing);
      return NextResponse.json({ error: 'Item already in watchlist' }, { status: 400 });
    }

    // Create new watchlist item
    const item = await db.watchlistItem.create({
      data: {
        externalId: String(externalId),
        type: type.toUpperCase(),
        title,
        imageUrl: imageUrl || null,
        year: year || null,
        rating: rating || null,
        episodes: episodes || null,
        status: status || 'PLAN_TO_WATCH',
      }
    });

    console.log('Successfully created item:', item);
    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json({
      error: 'Failed to add to watchlist',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const item = await db.watchlistItem.update({
      where: { id },
      data: { status: status.toUpperCase() }
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error updating watchlist item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.watchlistItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting from watchlist:', error);
    return NextResponse.json({ error: 'Failed to delete from watchlist' }, { status: 500 });
  }
}

