import { NextRequest, NextResponse } from 'next/server';
import { getCachedClient, getCoverPaths, setCoverPathWorked } from '@/lib/calibre-web';

// ============ In-memory cover cache ============

const coverCache = new Map<string, { data: Buffer; contentType: string; cachedAt: number }>();
const COVER_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
const MAX_COVER_CACHE = 200;

function evictStaleCovers() {
  if (coverCache.size <= MAX_COVER_CACHE) return;
  // Evict oldest entries
  let oldest: { key: string; time: number } | null = null;
  for (const [key, entry] of coverCache) {
    if (!oldest || entry.cachedAt < oldest.time) {
      oldest = { key, time: entry.cachedAt };
    }
  }
  if (oldest) coverCache.delete(oldest.key);
}

/**
 * Dedicated cover image proxy.
 * GET /api/calibre/cover?id=15
 * No session auth required (images loaded by <img> tags).
 */
export async function GET(request: NextRequest) {
  const bookId = request.nextUrl.searchParams.get('id');
  if (!bookId) {
    return NextResponse.json({ error: 'id parameter required' }, { status: 400 });
  }

  // Check in-memory cache first
  const cached = coverCache.get(bookId);
  if (cached && Date.now() - cached.cachedAt < COVER_CACHE_TTL) {
    return new NextResponse(new Uint8Array(cached.data), {
      headers: {
        'Content-Type': cached.contentType,
        'Content-Length': String(cached.data.length),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  const client = await getCachedClient();
  if (!client) {
    return NextResponse.json({ error: 'Not configured' }, { status: 400 });
  }

  try {
    const paths = getCoverPaths(bookId);
    const { data, contentType, resolvedPath } = await client.tryFetchBinary(paths);

    setCoverPathWorked(resolvedPath);

    // Store in cache
    coverCache.set(bookId, { data, contentType, cachedAt: Date.now() });
    evictStaleCovers();

    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(data.length),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Cover not found' }, { status: 404 });
  }
}
