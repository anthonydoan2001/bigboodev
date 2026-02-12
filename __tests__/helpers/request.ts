/**
 * Build a standard Request with cookies and optional JSON body.
 */
export function createMockRequest(opts: {
  url?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
  method?: string;
}): Request {
  const url = opts.url ?? 'http://localhost:3000/api/test';
  const headers = new Headers(opts.headers ?? {});

  if (opts.cookies && Object.keys(opts.cookies).length > 0) {
    const cookieStr = Object.entries(opts.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    headers.set('cookie', cookieStr);
  }

  const init: RequestInit = {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers,
  };

  if (opts.body) {
    headers.set('content-type', 'application/json');
    init.body = JSON.stringify(opts.body);
  }

  return new Request(url, init);
}

/**
 * Build a mock NextRequest for middleware tests.
 * Implements the subset of NextRequest API used by middleware.
 */
export function createMockNextRequest(opts: {
  url?: string;
  pathname?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
}) {
  const baseUrl = 'http://localhost:3000';
  const pathname = opts.pathname ?? '/';
  const url = opts.url ?? `${baseUrl}${pathname}`;
  const parsedUrl = new URL(url);

  const headers = new Headers(opts.headers ?? {});
  if (opts.cookies && Object.keys(opts.cookies).length > 0) {
    const cookieStr = Object.entries(opts.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    headers.set('cookie', cookieStr);
  }

  const cookieMap = new Map(
    Object.entries(opts.cookies ?? {}).map(([k, v]) => [k, { name: k, value: v }])
  );

  return {
    url,
    nextUrl: parsedUrl,
    headers,
    cookies: {
      get: (name: string) => cookieMap.get(name) ?? undefined,
      getAll: () => Array.from(cookieMap.values()),
      has: (name: string) => cookieMap.has(name),
    },
  } as unknown;
}
