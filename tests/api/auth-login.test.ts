import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest } from '../helpers/request';

vi.mock('@/lib/session', () => ({
  createSession: vi.fn().mockResolvedValue({
    token: 'new-session-token',
    expiresAt: new Date('2026-03-13T00:00:00Z'),
  }),
  cleanupExpiredSessions: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from '@/app/api/auth/login/route';

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'correct-password');
    vi.stubEnv('NODE_ENV', 'production');
  });

  it('returns 400 when password is missing', async () => {
    const req = createMockRequest({
      url: 'http://localhost:3000/api/auth/login',
      body: {},
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 for wrong password', async () => {
    const req = createMockRequest({
      url: 'http://localhost:3000/api/auth/login',
      body: { password: 'wrong-password' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 with cookie on correct password', async () => {
    const req = createMockRequest({
      url: 'http://localhost:3000/api/auth/login',
      body: { password: 'correct-password' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    const setCookie = res.headers.get('set-cookie')!;
    expect(setCookie).toContain('dashboard_session_token=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
  });

  it('includes Secure flag in production', async () => {
    const req = createMockRequest({
      url: 'http://localhost:3000/api/auth/login',
      body: { password: 'correct-password' },
    });
    const res = await POST(req);
    const setCookie = res.headers.get('set-cookie')!;
    expect(setCookie).toContain('Secure');
  });

  it('returns 500 when DASHBOARD_PASSWORD is not set', async () => {
    vi.stubEnv('DASHBOARD_PASSWORD', '');
    const req = createMockRequest({
      url: 'http://localhost:3000/api/auth/login',
      body: { password: 'anything' },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
