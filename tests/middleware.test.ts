import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockNextRequest } from './helpers/request';
import type { NextRequest } from 'next/server';

// Import after potential env stubs
import { middleware } from '@/middleware';

describe('middleware', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
  });

  it('allows /login page through', async () => {
    const req = createMockNextRequest({ pathname: '/login' });
    const res = await middleware(req as unknown as NextRequest);
    // NextResponse.next() doesn't redirect
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows /api/auth/* routes through', async () => {
    const req = createMockNextRequest({ pathname: '/api/auth/login' });
    const res = await middleware(req as unknown as NextRequest);
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows cron requests with valid secret', async () => {
    const req = createMockNextRequest({
      pathname: '/api/cron/cleanup',
      headers: { authorization: 'Bearer test-cron-secret' },
    });
    const res = await middleware(req as unknown as NextRequest);
    expect(res.status).not.toBe(401);
  });

  it('allows authenticated requests with session cookie', async () => {
    const req = createMockNextRequest({
      pathname: '/dashboard',
      cookies: { dashboard_session_token: 'valid-session' },
    });
    const res = await middleware(req as unknown as NextRequest);
    expect(res.headers.get('location')).toBeNull();
  });

  it('returns 401 for unauthenticated API requests', async () => {
    const req = createMockNextRequest({ pathname: '/api/notes' });
    const res = await middleware(req as unknown as NextRequest);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('redirects unauthenticated page requests to /login', async () => {
    const req = createMockNextRequest({ pathname: '/dashboard' });
    const res = await middleware(req as unknown as NextRequest);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
  });

  it('includes redirect path in login URL', async () => {
    const req = createMockNextRequest({ pathname: '/settings' });
    const res = await middleware(req as unknown as NextRequest);
    const location = res.headers.get('location')!;
    expect(location).toContain('redirect=%2Fsettings');
  });

  it('rejects invalid cron secret and redirects', async () => {
    const req = createMockNextRequest({
      pathname: '/dashboard',
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = await middleware(req as unknown as NextRequest);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
  });
});
