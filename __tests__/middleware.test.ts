import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockNextRequest } from './helpers/request';
import type { NextRequest } from 'next/server';

// Import after potential env stubs
import { middleware } from '@/middleware';

describe('middleware', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
  });

  it('allows /login page through', () => {
    const req = createMockNextRequest({ pathname: '/login' });
    const res = middleware(req as unknown as NextRequest);
    // NextResponse.next() doesn't redirect
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows /api/auth/* routes through', () => {
    const req = createMockNextRequest({ pathname: '/api/auth/login' });
    const res = middleware(req as unknown as NextRequest);
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows cron requests with valid secret', () => {
    const req = createMockNextRequest({
      pathname: '/api/cron/cleanup',
      headers: { authorization: 'Bearer test-cron-secret' },
    });
    const res = middleware(req as unknown as NextRequest);
    expect(res.status).not.toBe(401);
  });

  it('allows authenticated requests with session cookie', () => {
    const req = createMockNextRequest({
      pathname: '/dashboard',
      cookies: { dashboard_session_token: 'valid-session' },
    });
    const res = middleware(req as unknown as NextRequest);
    expect(res.headers.get('location')).toBeNull();
  });

  it('returns 401 for unauthenticated API requests', async () => {
    const req = createMockNextRequest({ pathname: '/api/notes' });
    const res = middleware(req as unknown as NextRequest);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('redirects unauthenticated page requests to /login', () => {
    const req = createMockNextRequest({ pathname: '/dashboard' });
    const res = middleware(req as unknown as NextRequest);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
  });

  it('includes redirect path in login URL', () => {
    const req = createMockNextRequest({ pathname: '/settings' });
    const res = middleware(req as unknown as NextRequest);
    const location = res.headers.get('location')!;
    expect(location).toContain('redirect=%2Fsettings');
  });

  it('rejects invalid cron secret and redirects', () => {
    const req = createMockNextRequest({
      pathname: '/dashboard',
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = middleware(req as unknown as NextRequest);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
  });
});
