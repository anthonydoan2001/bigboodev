import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { GameStatus } from '@/types/games';

export const GET = withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as GameStatus | null;

    const items = await db.game.findMany({
      where: status ? { status } : undefined,
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
    const {
      rawgGameId,
      gameTitle,
      coverArtUrl,
      rawgRating,
      releaseDate,
      genres,
      platforms,
      metacritic,
      status
    } = body;

    // Validate required fields
    if (!rawgGameId || !gameTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if game already exists
    const existing = await db.game.findUnique({
      where: { rawgGameId: Number(rawgGameId) }
    });

    if (existing) {
      // If status is being set, update the existing item
      if (status) {
        const updated = await db.game.update({
          where: { id: existing.id },
          data: { status: status.toUpperCase() }
        });
        return NextResponse.json({ item: updated });
      }
      return NextResponse.json({ error: 'Game already in list' }, { status: 400 });
    }

    // Create new game entry
    const item = await db.game.create({
      data: {
        rawgGameId: Number(rawgGameId),
        gameTitle,
        coverArtUrl: coverArtUrl || null,
        rawgRating: rawgRating || null,
        releaseDate: releaseDate || null,
        genres: genres || null,
        platforms: platforms || null,
        metacritic: metacritic || null,
        status: status || 'PLAYLIST',
      }
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error adding game:', error);
    return NextResponse.json({
      error: 'Failed to add game',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});

export const PATCH = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const validStatuses: GameStatus[] = ['PLAYING', 'PLAYED', 'PLAYLIST'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const item = await db.game.update({
      where: { id },
      data: { status: status.toUpperCase() }
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
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
    console.error('Error deleting game:', error);
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
  }
});
