import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, requireAuth } from '@/lib/api-auth';
import { createBasicAuthHeader } from '@/lib/komga';

const DEFAULT_USER_ID = 'default';

// Paths that don't require session auth (images accessed directly by browser)
function isImagePath(path: string[]): boolean {
  if (path.length < 2) return false;
  const lastSegment = path[path.length - 1];
  // Thumbnails: /series/{id}/thumbnail or /books/{id}/thumbnail
  if (lastSegment === 'thumbnail') return true;
  // Pages: /books/{id}/pages/{pageNum}
  if (path.length >= 3 && path[path.length - 2] === 'pages' && /^\d+$/.test(lastSegment)) return true;
  return false;
}

async function getKomgaCredentials() {
  const settings = await db.komgaSettings.findUnique({
    where: { userId: DEFAULT_USER_ID },
  });

  if (!settings) {
    return null;
  }

  return {
    serverUrl: settings.serverUrl,
    email: settings.email,
    password: settings.password,
  };
}

async function proxyRequest(
  request: NextRequest,
  path: string[],
  credentials: { serverUrl: string; email: string; password: string }
) {
  const komgaPath = `/api/v1/${path.join('/')}`;
  const url = new URL(request.url);
  const queryString = url.search;
  const fullUrl = `${credentials.serverUrl}${komgaPath}${queryString}`;

  const headers: HeadersInit = {
    'Authorization': createBasicAuthHeader(credentials.email, credentials.password),
  };

  // Forward content-type for non-GET requests
  const contentType = request.headers.get('content-type');
  const isMultipart = contentType?.includes('multipart/form-data');

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  // Get request body for non-GET methods
  let body: BodyInit | null = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    // Use arrayBuffer for multipart/binary data, text for JSON
    if (isMultipart) {
      body = await request.arrayBuffer();
    } else {
      body = await request.text();
    }
  }

  try {
    const response = await fetch(fullUrl, {
      method: request.method,
      headers,
      body,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return new NextResponse(errorText || 'Komga error', {
        status: response.status,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const responseContentType = response.headers.get('content-type') || '';

    // For image responses, return binary data
    if (responseContentType.startsWith('image/')) {
      const arrayBuffer = await response.arrayBuffer();
      return new NextResponse(arrayBuffer, {
        status: response.status,
        headers: {
          'Content-Type': responseContentType,
          'Cache-Control': 'public, max-age=86400', // Cache images for 24 hours
        },
      });
    }

    // For JSON responses
    if (responseContentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    // For other responses (like 204 No Content)
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // Default: return as text
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': responseContentType || 'text/plain',
      },
    });
  } catch (error) {
    console.error('Komga proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Komga server' },
      { status: 502 }
    );
  }
}

// Handle all HTTP methods
// GET is special: thumbnail requests skip session auth (for Next.js Image Optimization)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/api\/komga\/(.+)/);
  const path = pathMatch ? pathMatch[1].split('/') : [];

  // Image requests don't require session auth (still use Komga's stored credentials)
  if (!isImagePath(path)) {
    try {
      requireAuth(request);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const credentials = await getKomgaCredentials();
  if (!credentials) {
    return NextResponse.json(
      { error: 'Komga not configured. Please add your credentials in Settings.' },
      { status: 400 }
    );
  }

  return proxyRequest(request, path, credentials);
}

export const POST = withAuth(async (request: NextRequest) => {
  const credentials = await getKomgaCredentials();
  if (!credentials) {
    return NextResponse.json(
      { error: 'Komga not configured. Please add your credentials in Settings.' },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/api\/komga\/(.+)/);
  const path = pathMatch ? pathMatch[1].split('/') : [];

  return proxyRequest(request, path, credentials);
});

export const PATCH = withAuth(async (request: NextRequest) => {
  const credentials = await getKomgaCredentials();
  if (!credentials) {
    return NextResponse.json(
      { error: 'Komga not configured. Please add your credentials in Settings.' },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/api\/komga\/(.+)/);
  const path = pathMatch ? pathMatch[1].split('/') : [];

  return proxyRequest(request, path, credentials);
});

export const DELETE = withAuth(async (request: NextRequest) => {
  const credentials = await getKomgaCredentials();
  if (!credentials) {
    return NextResponse.json(
      { error: 'Komga not configured. Please add your credentials in Settings.' },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/api\/komga\/(.+)/);
  const path = pathMatch ? pathMatch[1].split('/') : [];

  return proxyRequest(request, path, credentials);
});

export const PUT = withAuth(async (request: NextRequest) => {
  const credentials = await getKomgaCredentials();
  if (!credentials) {
    return NextResponse.json(
      { error: 'Komga not configured. Please add your credentials in Settings.' },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/api\/komga\/(.+)/);
  const path = pathMatch ? pathMatch[1].split('/') : [];

  return proxyRequest(request, path, credentials);
});
