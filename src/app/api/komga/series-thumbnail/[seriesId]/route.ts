import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';

const KOMGA_API_URL = process.env.KOMGA_API_URL || 'https://komga.bigboo.dev/api/v1';
const KOMGA_USERNAME = process.env.KOMGA_USERNAME;
const KOMGA_PASSWORD = process.env.KOMGA_PASSWORD;

function getAuthHeaders(): HeadersInit {
  if (!KOMGA_USERNAME || !KOMGA_PASSWORD) {
    throw new Error('Komga credentials not configured');
  }
  
  const credentials = Buffer.from(`${KOMGA_USERNAME}:${KOMGA_PASSWORD}`).toString('base64');
  return {
    'Authorization': `Basic ${credentials}`,
  };
}

// Generate a simple placeholder SVG image
function generatePlaceholderSVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
    <rect fill="#1f2937" width="200" height="300"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text>
  </svg>`;
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    if (!KOMGA_API_URL || !KOMGA_USERNAME || !KOMGA_PASSWORD) {
      console.error('Komga API not configured - missing environment variables');
      return new NextResponse('Komga API not configured', { status: 500 });
    }

    // Extract seriesId from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const seriesIdIndex = pathParts.indexOf('series-thumbnail') + 1;
    const seriesId = pathParts[seriesIdIndex];
    
    if (!seriesId) {
      console.error('Series ID is missing from URL path:', url.pathname);
      return new NextResponse('Series ID is required', { status: 400 });
    }

    const thumbnailUrl = `${KOMGA_API_URL}/series/${seriesId}/thumbnail`;
    console.log(`Fetching series thumbnail from: ${thumbnailUrl}`);
    
    const authHeaders = getAuthHeaders();
    const response = await fetch(thumbnailUrl, {
      method: 'GET',
      headers: authHeaders,
    });

    console.log(`Komga series thumbnail response status: ${response.status}`);

    // Handle 204 No Content
    if (response.status === 204) {
      console.log(`Series thumbnail returns 204 No Content for series ${seriesId}, returning placeholder`);
      const placeholder = generatePlaceholderSVG();
      return new NextResponse(placeholder, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
    }

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Series thumbnail not found for series ${seriesId}, returning placeholder`);
        const placeholder = generatePlaceholderSVG();
        return new NextResponse(placeholder, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
          },
        });
      }
      
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Komga series thumbnail error ${response.status}:`, errorText);
      
      const placeholder = generatePlaceholderSVG();
      return new NextResponse(placeholder, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
    }

    // Check if response has content
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      console.log(`Series thumbnail has no content for series ${seriesId}, returning placeholder`);
      const placeholder = generatePlaceholderSVG();
      return new NextResponse(placeholder, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
    }

    // Get the image data
    let imageBuffer: ArrayBuffer;
    try {
      imageBuffer = await response.arrayBuffer();
    } catch (error) {
      console.error(`Failed to read series thumbnail buffer for series ${seriesId}:`, error);
      const placeholder = generatePlaceholderSVG();
      return new NextResponse(placeholder, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
    }
    
    if (!imageBuffer || imageBuffer.byteLength === 0) {
      console.log(`Series thumbnail buffer is empty for series ${seriesId}, returning placeholder`);
      const placeholder = generatePlaceholderSVG();
      return new NextResponse(placeholder, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    console.log(`Successfully fetched series thumbnail for series ${seriesId}, size: ${imageBuffer.byteLength} bytes, type: ${contentType}`);

    // Ensure we have a valid buffer before returning
    if (imageBuffer.byteLength > 0) {
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    } else {
      const placeholder = generatePlaceholderSVG();
      return new NextResponse(placeholder, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching Komga series thumbnail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    const placeholder = generatePlaceholderSVG();
    return new NextResponse(placeholder, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  }
});
