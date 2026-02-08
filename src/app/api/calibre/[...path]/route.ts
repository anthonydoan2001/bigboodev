import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, requireAuth } from '@/lib/api-auth';
import { CalibreWebClient } from '@/lib/calibre-web';

const DEFAULT_USER_ID = 'default';

// Paths that don't require session auth (images accessed directly by browser)
function isBinaryPath(path: string[]): boolean {
  if (path.length < 2) return false;
  // covers: books/{id}/cover
  if (path[path.length - 1] === 'cover') return true;
  // downloads: books/{id}/download/{format}
  if (path.length >= 3 && path[path.length - 2] === 'download') return true;
  return false;
}

async function getCalibreCredentials() {
  const settings = await db.calibreWebSettings.findUnique({
    where: { userId: DEFAULT_USER_ID },
  });

  if (!settings) return null;

  return {
    serverUrl: settings.serverUrl,
    username: settings.username,
    password: settings.password,
  };
}

async function handleRequest(request: NextRequest, path: string[]) {
  const credentials = await getCalibreCredentials();
  if (!credentials) {
    return NextResponse.json(
      { error: 'Calibre-Web not configured. Please add your credentials in Settings.' },
      { status: 400 }
    );
  }

  const client = new CalibreWebClient(
    credentials.serverUrl,
    credentials.username,
    credentials.password
  );

  const route = path[0];

  try {
    switch (route) {
      case 'books': {
        if (path.length === 1) {
          // GET /api/calibre/books?feed=new|hot|letter|...
          const url = new URL(request.url);
          const feed = url.searchParams.get('feed') || 'new';
          const books = await client.getBooks(`/opds/${feed}`);
          return NextResponse.json({ books, total: books.length });
        }

        const bookId = parseInt(path[1], 10);

        if (path[2] === 'cover') {
          // GET /api/calibre/books/{id}/cover — proxy cover image
          console.log(`[calibre] Cover request for book ${bookId}`);
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
          } catch (coverErr) {
            console.error(`[calibre] Cover ${bookId} FAILED:`, coverErr);
            throw coverErr;
          }
        }

        if (path[2] === 'download' && path[3]) {
          // GET /api/calibre/books/{id}/download/{format} — proxy book file
          const format = path[3];

          const mimeMap: Record<string, string> = {
            epub: 'application/epub+zip',
            pdf: 'application/pdf',
            mobi: 'application/x-mobipocket-ebook',
            cbz: 'application/x-cbz',
            cbr: 'application/x-cbr',
          };

          const { data, contentType } = await client.tryFetchBinary([
            `/opds/download/${bookId}/${format}/`,
          ]);

          return new NextResponse(new Uint8Array(data), {
            headers: {
              'Content-Type': mimeMap[format] || contentType,
              'Content-Length': String(data.length),
              'Content-Disposition': `inline; filename="book-${bookId}.${format}"`,
              'Cache-Control': 'no-store',
            },
          });
        }

        if (path.length === 2) {
          // GET /api/calibre/books/{id} — single book
          const book = await client.getBookById(bookId);
          if (!book) {
            return NextResponse.json(
              { error: 'Book not found' },
              { status: 404 }
            );
          }
          return NextResponse.json(book);
        }

        return NextResponse.json({ error: 'Invalid path' }, { status: 404 });
      }

      case 'search': {
        const url = new URL(request.url);
        const q = url.searchParams.get('q') || '';
        if (!q) {
          return NextResponse.json({ books: [], total: 0 });
        }
        const books = await client.searchBooks(q);
        return NextResponse.json({ books, total: books.length });
      }

      case 'authors': {
        const authors = await client.getAuthors();
        return NextResponse.json(authors);
      }

      case 'series': {
        const series = await client.getSeries();
        return NextResponse.json(series);
      }

      case 'shelves': {
        const shelves = await client.getShelves();
        return NextResponse.json(shelves);
      }

      case 'feed': {
        // Generic feed proxy: /api/calibre/feed?path=/opds/...
        const url = new URL(request.url);
        const feedPath = url.searchParams.get('path');
        if (!feedPath) {
          return NextResponse.json(
            { error: 'path parameter required' },
            { status: 400 }
          );
        }
        const books = await client.getBooksByFeed(feedPath);
        return NextResponse.json({ books, total: books.length });
      }

      default:
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Calibre-Web proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Calibre-Web server' },
      { status: 502 }
    );
  }
}

// GET - Handle image and data requests
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/api\/calibre\/(.+)/);
  const path = pathMatch ? pathMatch[1].split('/') : [];

  // Binary paths (covers, downloads) skip session auth
  if (!isBinaryPath(path)) {
    try {
      requireAuth(request);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return handleRequest(request, path);
}

export const POST = withAuth(async (request: NextRequest) => {
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/api\/calibre\/(.+)/);
  const path = pathMatch ? pathMatch[1].split('/') : [];
  return handleRequest(request, path);
});
