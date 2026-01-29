import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { createBasicAuthHeader } from '@/lib/komga';

const DEFAULT_USER_ID = 'default';

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

async function fetchFromKomga(
  credentials: { serverUrl: string; email: string; password: string },
  path: string,
  queryParams?: URLSearchParams
) {
  const queryString = queryParams?.toString();
  const url = `${credentials.serverUrl}/api/v1${path}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: {
      Authorization: createBasicAuthHeader(credentials.email, credentials.password),
    },
  });

  if (!response.ok) {
    throw new Error(`Komga API error: ${response.status}`);
  }

  return response.json();
}

// Dashboard endpoint - fetches all data needed for manga page in parallel
export const GET = withAuth(async (request: NextRequest) => {
  const credentials = await getKomgaCredentials();
  if (!credentials) {
    return NextResponse.json(
      { error: 'Komga not configured' },
      { status: 400 }
    );
  }

  try {
    // Fetch libraries, in-progress books, and read lists in parallel
    const [libraries, inProgressBooks, readLists] = await Promise.all([
      fetchFromKomga(credentials, '/libraries'),
      fetchFromKomga(credentials, '/books', new URLSearchParams({
        read_status: 'IN_PROGRESS',
        sort: 'readProgress.lastModified,desc',
        size: '50',
      })),
      fetchFromKomga(credentials, '/readlists', new URLSearchParams({
        size: '50',
      })),
    ]);

    // Extract unique series IDs from in-progress books
    const uniqueSeriesIds = [...new Set(
      inProgressBooks.content?.map((book: { seriesId: string }) => book.seriesId) || []
    )] as string[];

    // Batch fetch series data if there are any
    let seriesMap: Record<string, unknown> = {};
    if (uniqueSeriesIds.length > 0) {
      // Fetch series in parallel batches of 10 to avoid overwhelming the server
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < uniqueSeriesIds.length; i += batchSize) {
        batches.push(uniqueSeriesIds.slice(i, i + batchSize));
      }

      const seriesResults = await Promise.all(
        batches.map(async (batch) => {
          const batchResults = await Promise.all(
            batch.map(async (seriesId) => {
              try {
                const series = await fetchFromKomga(credentials, `/series/${seriesId}`);
                return { id: seriesId, data: series };
              } catch {
                return { id: seriesId, data: null };
              }
            })
          );
          return batchResults;
        })
      );

      // Flatten and create map
      seriesResults.flat().forEach(({ id, data }) => {
        if (data) {
          seriesMap[id] = data;
        }
      });
    }

    return NextResponse.json({
      libraries,
      inProgressBooks,
      readLists,
      seriesMap,
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 502 }
    );
  }
});
