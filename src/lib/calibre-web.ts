/**
 * Calibre-Web API Client
 * Handles communication with the Calibre-Web server via OPDS feeds
 */

import { XMLParser } from 'fast-xml-parser';
import {
  CalibreBook,
  CalibreAuthor,
  CalibreSeries,
  CalibreShelf,
  OPDSFeed,
  OPDSEntry,
  OPDSLink,
} from '@/types/calibre-web';

// ============ Auth Helper ============

export function createBasicAuthHeader(username: string, password: string): string {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${credentials}`;
}

// ============ OPDS XML Parser ============

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (tagName) => {
    // These tags can appear multiple times
    return ['entry', 'link', 'category', 'author'].includes(tagName);
  },
});

function parseOPDSFeed(xml: string): OPDSFeed {
  const parsed = xmlParser.parse(xml);
  const feed = parsed.feed;

  if (!feed) {
    throw new Error('Invalid OPDS feed: no feed element');
  }

  const entries: OPDSEntry[] = (feed.entry || []).map((entry: Record<string, unknown>) => {
    const links: OPDSLink[] = (
      (entry.link as Array<Record<string, string>>) || []
    ).map((link: Record<string, string>) => ({
      href: link['@_href'] || '',
      rel: link['@_rel'] || undefined,
      type: link['@_type'] || undefined,
      title: link['@_title'] || undefined,
    }));

    const authors: string[] = [];
    const authorData = entry.author;
    if (Array.isArray(authorData)) {
      authorData.forEach((a: Record<string, string>) => {
        if (a.name) authors.push(a.name);
      });
    } else if (authorData && typeof authorData === 'object') {
      const a = authorData as Record<string, string>;
      if (a.name) authors.push(a.name);
    }

    const categories: string[] = [];
    const categoryData = entry.category;
    if (Array.isArray(categoryData)) {
      categoryData.forEach((c: Record<string, string>) => {
        if (c['@_term']) categories.push(c['@_term']);
        else if (c['@_label']) categories.push(c['@_label']);
      });
    }

    // Extract series info from schema:Series or dcterms
    let series: string | undefined;
    let seriesIndex: number | undefined;

    // Try schema namespace
    const schemaSeries = entry['schema:Series'] as Record<string, string> | undefined;
    if (schemaSeries) {
      series = schemaSeries['@_name'] || schemaSeries['schema:name'] as string;
      const pos = schemaSeries['schema:position'];
      if (pos) seriesIndex = parseFloat(pos);
    }

    // Extract rating
    let rating: number | undefined;
    const ratingVal = entry['opds:rating'] || entry['calibre:rating'];
    if (ratingVal) rating = parseFloat(String(ratingVal));

    return {
      id: String(entry.id || ''),
      title: String(entry.title || ''),
      authors,
      summary: entry.summary ? String(entry.summary) : undefined,
      updated: entry.updated ? String(entry.updated) : undefined,
      links,
      categories,
      content: entry.content
        ? typeof entry.content === 'object'
          ? (entry.content as Record<string, string>)['#text'] || ''
          : String(entry.content)
        : undefined,
      series,
      seriesIndex,
      rating,
      publisher: entry['dcterms:publisher']
        ? String(entry['dcterms:publisher'])
        : undefined,
      language: entry['dcterms:language']
        ? String(entry['dcterms:language'])
        : undefined,
    };
  });

  const feedLinks: OPDSLink[] = (feed.link || []).map(
    (link: Record<string, string>) => ({
      href: link['@_href'] || '',
      rel: link['@_rel'] || undefined,
      type: link['@_type'] || undefined,
      title: link['@_title'] || undefined,
    })
  );

  // Extract total results from opensearch namespace
  let totalResults: number | undefined;
  const total =
    feed['opensearch:totalResults'] || feed['totalResults'];
  if (total) totalResults = parseInt(String(total), 10);

  return {
    title: String(feed.title || ''),
    entries,
    links: feedLinks,
    totalResults,
  };
}

function extractIdFromLinks(links: OPDSLink[]): number | null {
  // Try cover link: /cover/{id}
  for (const link of links) {
    const coverMatch = link.href?.match(/\/cover\/(\d+)/);
    if (coverMatch) return parseInt(coverMatch[1], 10);
  }
  // Try acquisition/download link: /download/{id}/{format}
  for (const link of links) {
    const dlMatch = link.href?.match(/\/download\/(\d+)\//);
    if (dlMatch) return parseInt(dlMatch[1], 10);
  }
  // Try entry detail link: /opds/{id} (Calibre-Web always includes this)
  for (const link of links) {
    const detailMatch = link.href?.match(/\/opds\/(\d+)(?:\?|$)/);
    if (detailMatch) return parseInt(detailMatch[1], 10);
  }
  // Try any link with a bare numeric path segment after a known prefix
  for (const link of links) {
    const anyMatch = link.href?.match(/\/(\d+)(?:\/|$|\?)/);
    if (anyMatch) return parseInt(anyMatch[1], 10);
  }
  return null;
}

function entryToBook(entry: OPDSEntry, serverUrl: string): CalibreBook {
  // Extract book ID from cover/download link hrefs (only reliable source)
  // Entry <id> is a UUID (urn:uuid:...) — NOT the integer book ID
  let bookId: number;
  const linkId = extractIdFromLinks(entry.links);
  if (linkId !== null) {
    bookId = linkId;
  } else {
    // Links didn't contain a parseable ID — log for debugging
    console.warn(
      `[calibre] Could not extract book ID from links for "${entry.title}" (entry.id: ${entry.id}). Links:`,
      entry.links.map((l) => ({ href: l.href, rel: l.rel, type: l.type }))
    );
    // Last resort: hash the UUID to get a unique-ish number (won't map to real Calibre ID)
    bookId = Math.abs(
      entry.id.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
    );
  }

  // Extract formats and download links from acquisition links
  const formats: string[] = [];
  const downloadLinks: Record<string, string> = {};
  const acquisitionLinks = entry.links.filter(
    (l) =>
      l.rel?.includes('acquisition') ||
      l.type?.includes('application/epub') ||
      l.type?.includes('application/pdf') ||
      l.type?.includes('application/x-mobipocket')
  );

  for (const link of acquisitionLinks) {
    let fmt: string | null = null;
    if (link.type?.includes('epub')) fmt = 'epub';
    else if (link.type?.includes('pdf')) fmt = 'pdf';
    else if (link.type?.includes('mobi') || link.type?.includes('mobipocket'))
      fmt = 'mobi';
    else if (link.type?.includes('cbz')) fmt = 'cbz';
    else if (link.type?.includes('cbr')) fmt = 'cbr';

    if (fmt) {
      formats.push(fmt);
      downloadLinks[fmt] = link.href;
    }
  }

  // Extract cover URL
  const coverLink = entry.links.find(
    (l) =>
      l.rel?.includes('image') ||
      l.rel?.includes('thumbnail') ||
      l.type?.startsWith('image/')
  );

  const coverUrl = coverLink
    ? coverLink.href.startsWith('http')
      ? coverLink.href
      : `${serverUrl}${coverLink.href}`
    : '';

  return {
    id: bookId,
    title: entry.title,
    authors: entry.authors,
    description: entry.content || entry.summary,
    publisher: entry.publisher,
    languages: entry.language ? [entry.language] : undefined,
    tags: entry.categories,
    series: entry.series,
    seriesIndex: entry.seriesIndex,
    formats: [...new Set(formats)],
    downloadLinks: Object.keys(downloadLinks).length > 0 ? downloadLinks : undefined,
    coverUrl,
    rating: entry.rating,
  };
}

// ============ Server-side Calibre-Web Client ============

export class CalibreWebClient {
  private serverUrl: string;
  private authHeader: string;
  private username: string;
  private password: string;

  constructor(serverUrl: string, username: string, password: string) {
    this.serverUrl = serverUrl.replace(/\/$/, '');
    this.authHeader = createBasicAuthHeader(username, password);
    this.username = username;
    this.password = password;
  }

  private async fetchOPDS(path: string): Promise<OPDSFeed> {
    const url = `${this.serverUrl}${path}`;

    const response = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
        Accept: 'application/atom+xml, application/xml, text/xml',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Calibre-Web API error: ${response.status} - ${errorText}`
      );
    }

    const xml = await response.text();
    return parseOPDSFeed(xml);
  }

  async fetchBinary(
    path: string
  ): Promise<{ data: Buffer; contentType: string }> {
    const url = path.startsWith('http') ? path : `${this.serverUrl}${path}`;

    const response = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Calibre-Web fetchBinary error: ${response.status} for ${path}`);
    }

    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';

    // Detect HTML responses (login pages, error pages) that aren't actual binary content
    if (contentType.includes('text/html')) {
      const text = await response.text();
      console.error(`Calibre-Web fetchBinary got HTML instead of binary for ${path}:`, text.substring(0, 200));
      throw new Error(`Calibre-Web returned HTML instead of binary for ${path}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
      data: Buffer.from(arrayBuffer),
      contentType,
    };
  }

  /**
   * Try fetching binary from multiple paths, returning the first success.
   */
  async tryFetchBinary(
    paths: string[]
  ): Promise<{ data: Buffer; contentType: string }> {
    const errors: string[] = [];
    for (const path of paths) {
      try {
        return await this.fetchBinary(path);
      } catch (err) {
        errors.push(`${path}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    throw new Error(`All download paths failed:\n${errors.join('\n')}`);
  }

  // ============ Test Connection ============

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.serverUrl}/opds`;

      const response = await fetch(url, {
        headers: {
          Authorization: this.authHeader,
          Accept: 'application/atom+xml, application/xml, text/xml',
        },
        redirect: 'follow',
      });

      if (response.ok) {
        return { success: true };
      }

      if (response.status === 401) {
        return { success: false, error: 'Invalid username or password' };
      }
      if (response.status === 403) {
        return {
          success: false,
          error: 'Access forbidden - check user permissions',
        };
      }
      return {
        success: false,
        error: `Server returned ${response.status}`,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('ECONNREFUSED')) {
        return {
          success: false,
          error: 'Cannot connect to server - connection refused',
        };
      }
      if (message.includes('ENOTFOUND')) {
        return { success: false, error: 'Server not found - check the URL' };
      }
      if (message.includes('ETIMEDOUT')) {
        return { success: false, error: 'Connection timed out' };
      }
      return { success: false, error: `Connection failed: ${message}` };
    }
  }

  // ============ Books ============

  async getBooks(feedPath: string = '/opds/new'): Promise<CalibreBook[]> {
    const feed = await this.fetchOPDS(feedPath);
    return feed.entries.map((e) => entryToBook(e, this.serverUrl));
  }

  async getBookById(bookId: number): Promise<CalibreBook | null> {
    // Search known feeds for the book by its numeric ID
    for (const feedPath of ['/opds/new', '/opds/hot']) {
      try {
        const feed = await this.fetchOPDS(feedPath);
        for (const entry of feed.entries) {
          const id = extractIdFromLinks(entry.links);
          if (id === bookId) {
            return entryToBook(entry, this.serverUrl);
          }
        }
      } catch {
        // Feed might not exist, continue
      }
    }

    // Book not in recent feeds — verify it exists via cover, return minimal data
    try {
      await this.fetchBinary(`/opds/cover/${bookId}`);
      return {
        id: bookId,
        title: '',
        authors: [],
        formats: [],
        coverUrl: `${this.serverUrl}/opds/cover/${bookId}`,
      };
    } catch {
      return null;
    }
  }

  async searchBooks(query: string): Promise<CalibreBook[]> {
    const feed = await this.fetchOPDS(
      `/opds/search?query=${encodeURIComponent(query)}`
    );
    return feed.entries.map((e) => entryToBook(e, this.serverUrl));
  }

  // ============ Navigation Feeds ============

  async getAuthors(): Promise<CalibreAuthor[]> {
    const feed = await this.fetchOPDS('/opds/author');
    return feed.entries.map((entry) => {
      const navLink = entry.links.find(
        (l) => l.type?.includes('navigation') || l.type?.includes('atom')
      );
      return {
        id: entry.id,
        name: entry.title,
        url: navLink?.href || '',
      };
    });
  }

  async getSeries(): Promise<CalibreSeries[]> {
    const feed = await this.fetchOPDS('/opds/series');
    return feed.entries.map((entry) => {
      const navLink = entry.links.find(
        (l) => l.type?.includes('navigation') || l.type?.includes('atom')
      );
      return {
        id: entry.id,
        name: entry.title,
        url: navLink?.href || '',
      };
    });
  }

  async getShelves(): Promise<CalibreShelf[]> {
    const feed = await this.fetchOPDS('/opds/shelf');
    return feed.entries.map((entry) => {
      const navLink = entry.links.find(
        (l) => l.type?.includes('navigation') || l.type?.includes('atom')
      );
      return {
        id: entry.id,
        name: entry.title,
        url: navLink?.href || '',
      };
    });
  }

  async getBooksByFeed(feedUrl: string): Promise<CalibreBook[]> {
    const path = feedUrl.startsWith('/') ? feedUrl : `/${feedUrl}`;
    const feed = await this.fetchOPDS(path);
    return feed.entries.map((e) => entryToBook(e, this.serverUrl));
  }

  /** Expose raw OPDS feed for debugging */
  async debugFetchOPDS(feedPath: string): Promise<OPDSFeed> {
    return this.fetchOPDS(feedPath);
  }
}

// ============ Singleton ============

export function getCalibreWebClient(
  serverUrl: string,
  username: string,
  password: string
): CalibreWebClient {
  return new CalibreWebClient(serverUrl, username, password);
}
