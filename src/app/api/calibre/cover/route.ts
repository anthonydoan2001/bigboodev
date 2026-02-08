import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CalibreWebClient } from '@/lib/calibre-web';

const DEFAULT_USER_ID = 'default';

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

  console.log(`[calibre] Cover route hit for book ${bookId}`);

  const settings = await db.calibreWebSettings.findUnique({
    where: { userId: DEFAULT_USER_ID },
  });

  if (!settings) {
    return NextResponse.json({ error: 'Not configured' }, { status: 400 });
  }

  const client = new CalibreWebClient(
    settings.serverUrl,
    settings.username,
    settings.password
  );

  try {
    const { data, contentType } = await client.tryFetchBinary([
      `/opds/cover/${bookId}`,
      `/cover/${bookId}`,
    ]);

    console.log(`[calibre] Cover ${bookId}: ${contentType}, ${data.length} bytes`);

    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(data.length),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error(`[calibre] Cover ${bookId} FAILED:`, err);
    return NextResponse.json({ error: 'Cover not found' }, { status: 404 });
  }
}
