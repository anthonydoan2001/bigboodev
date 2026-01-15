import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async () => {
  try {
    const items = await db.game.findMany({
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    console.log('Received POST body:', body);

    const { externalId, title, imageUrl, rating, released, status } = body;

    // Validate required fields
    if (!externalId || !title) {
      console.error('Missing required fields:', { externalId, title });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if item already exists
    const existing = await db.game.findUnique({
      where: {
        externalId: String(externalId),
      }
    });

    if (existing) {
      // If status is being set to PLAYING or PLAYED, update the existing item
      if (status === 'PLAYING' || status === 'PLAYED') {
        const updated = await db.game.update({
          where: { id: existing.id },
          data: { status: status.toUpperCase() }
        });
        
        // Trigger top games refresh in background (fire and forget, no await)
        triggerTopGamesRefreshIfNeeded(request);
        
        return NextResponse.json({ item: updated });
      }
      console.log('Item already exists:', existing);
      return NextResponse.json({ error: 'Item already in games list' }, { status: 400 });
    }

    // Create new game item
    const item = await db.game.create({
      data: {
        externalId: String(externalId),
        title,
        imageUrl: imageUrl || null,
        rating: rating || null,
        released: released || null,
        status: status || 'PLAN_TO_PLAY',
      }
    });

    console.log('Successfully created item:', item);
    
    // Trigger top games refresh in background (fire and forget, no await)
    triggerTopGamesRefreshIfNeeded(request);
    
    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error adding to games:', error);
    return NextResponse.json({
      error: 'Failed to add to games',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});

/**
 * Trigger top games refresh in the background (fire and forget)
 * The refresh endpoint will check if it needs to refresh (5 minute cooldown)
 * Uses the request URL to determine the base URL
 */
function triggerTopGamesRefreshIfNeeded(request: Request): void {
  // Trigger refresh without await - truly fire and forget
  // The refresh endpoint will check if it needs to refresh based on last update time
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const refreshUrl = `${baseUrl}/api/games/top/refresh`;
  
  // Fire and forget - don't wait for response
  fetch(refreshUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
    },
  }).catch(err => {
    // Silently fail - this is background work
    console.error('Top games refresh fetch failed:', err);
  });
}

export const PATCH = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const item = await db.game.update({
      where: { id },
      data: { status: status.toUpperCase() }
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error updating game item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.game.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting from games:', error);
    return NextResponse.json({ error: 'Failed to delete from games' }, { status: 500 });
  }
});
