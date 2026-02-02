import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';

export const POST = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || !url.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch the page with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let html: string;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json({
          title: parsedUrl.hostname,
          faviconUrl: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
          description: null,
        });
      }

      html = await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      // Return fallback on fetch error
      return NextResponse.json({
        title: parsedUrl.hostname,
        faviconUrl: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
        description: null,
      });
    }

    // Parse title
    let title = parsedUrl.hostname;
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
      // Decode HTML entities
      title = title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
    }

    // Parse description from meta tag
    let description: string | null = null;
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
    if (descMatch && descMatch[1]) {
      description = descMatch[1].trim().substring(0, 500);
    }

    // Parse favicon
    let faviconUrl: string | null = null;

    // Try to find favicon in link tags
    const iconPatterns = [
      /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["'][^>]*>/i,
      /<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i,
      /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']*)["'][^>]*>/i,
    ];

    for (const pattern of iconPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const iconHref = match[1];
        // Handle relative URLs
        if (iconHref.startsWith('//')) {
          faviconUrl = `https:${iconHref}`;
        } else if (iconHref.startsWith('/')) {
          faviconUrl = `${parsedUrl.origin}${iconHref}`;
        } else if (iconHref.startsWith('http')) {
          faviconUrl = iconHref;
        } else {
          faviconUrl = `${parsedUrl.origin}/${iconHref}`;
        }
        break;
      }
    }

    // Fallback to Google's favicon service
    if (!faviconUrl) {
      faviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`;
    }

    return NextResponse.json({
      title,
      faviconUrl,
      description,
    });
  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch URL metadata',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
