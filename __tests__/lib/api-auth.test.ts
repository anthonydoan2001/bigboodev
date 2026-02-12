import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest } from '../helpers/request';

// Mock session validation at module level
vi.mock('@/lib/session', () => ({
  validateSession: vi.fn(),
}));

import {
  getSessionToken,
  requireAuth,
  withAuth,
  requireAuthOrCron,
} from '@/lib/api-auth';
import { validateSession } from '@/lib/session';

const mockValidateSession = vi.mocked(validateSession);

describe('getSessionToken', () => {
  it('extracts session token from cookie header', () => {
    const req = createMockRequest({
      cookies: { dashboard_session_token: 'abc123' },
    });
    expect(getSessionToken(req)).toBe('abc123');
  });

  it('returns null when no cookie header', () => {
    const req = createMockRequest({});
    expect(getSessionToken(req)).toBeNull();
  });

  it('returns null when session cookie is absent among other cookies', () => {
    const req = createMockRequest({
      cookies: { other_cookie: 'value' },
    });
    expect(getSessionToken(req)).toBeNull();
  });

  it('handles cookies with = in value', () => {
    const req = createMockRequest({
      cookies: { dashboard_session_token: 'abc=123=xyz' },
    });
    expect(getSessionToken(req)).toBe('abc=123=xyz');
  });
});

describe('requireAuth', () => {
  beforeEach(() => {
    mockValidateSession.mockReset();
  });

  it('returns token when session is valid', async () => {
    mockValidateSession.mockResolvedValue(true);
    const req = createMockRequest({
      cookies: { dashboard_session_token: 'valid-token' },
    });
    const token = await requireAuth(req);
    expect(token).toBe('valid-token');
  });

  it('throws UNAUTHORIZED when no cookie', async () => {
    const req = createMockRequest({});
    await expect(requireAuth(req)).rejects.toThrow('UNAUTHORIZED');
  });

  it('throws UNAUTHORIZED when session is invalid', async () => {
    mockValidateSession.mockResolvedValue(false);
    const req = createMockRequest({
      cookies: { dashboard_session_token: 'invalid-token' },
    });
    await expect(requireAuth(req)).rejects.toThrow('UNAUTHORIZED');
  });
});

describe('withAuth', () => {
  beforeEach(() => {
    mockValidateSession.mockReset();
  });

  it('calls handler with token on valid session', async () => {
    mockValidateSession.mockResolvedValue(true);
    const handler = vi.fn().mockResolvedValue(new Response('ok'));
    const wrapped = withAuth(handler);
    const req = createMockRequest({
      cookies: { dashboard_session_token: 'token123' },
    });
    await wrapped(req);
    expect(handler).toHaveBeenCalledWith(req, 'token123');
  });

  it('returns 401 on invalid session', async () => {
    mockValidateSession.mockResolvedValue(false);
    const handler = vi.fn();
    const wrapped = withAuth(handler);
    const req = createMockRequest({});
    const res = await wrapped(req);
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('requireAuthOrCron', () => {
  beforeEach(() => {
    mockValidateSession.mockReset();
  });

  it('accepts valid cron secret', async () => {
    vi.stubEnv('CRON_SECRET', 'my-cron-secret');
    const req = createMockRequest({
      headers: { authorization: 'Bearer my-cron-secret' },
    });
    const result = await requireAuthOrCron(req);
    expect(result.type).toBe('cron');
  });

  it('falls back to session auth when cron header is missing', async () => {
    vi.stubEnv('CRON_SECRET', 'my-cron-secret');
    mockValidateSession.mockResolvedValue(true);
    const req = createMockRequest({
      cookies: { dashboard_session_token: 'session-tok' },
    });
    const result = await requireAuthOrCron(req);
    expect(result.type).toBe('session');
  });

  it('rejects invalid cron secret and falls through to session', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret');
    mockValidateSession.mockResolvedValue(false);
    const req = createMockRequest({
      headers: { authorization: 'Bearer wrong-secret' },
    });
    await expect(requireAuthOrCron(req)).rejects.toThrow('UNAUTHORIZED');
  });
});
