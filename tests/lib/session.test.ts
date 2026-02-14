import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDb = vi.hoisted(() => {
  const fn = vi.fn;
  function createMockModel() {
    return {
      findMany: fn().mockResolvedValue([]),
      findFirst: fn().mockResolvedValue(null),
      findUnique: fn().mockResolvedValue(null),
      create: fn().mockResolvedValue({}),
      update: fn().mockResolvedValue({}),
      delete: fn().mockResolvedValue({}),
      deleteMany: fn().mockResolvedValue({ count: 0 }),
      count: fn().mockResolvedValue(0),
      groupBy: fn().mockResolvedValue([]),
    };
  }
  return {
    session: createMockModel(),
    note: createMockModel(),
    task: createMockModel(),
  };
});

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

import {
  generateSecureToken,
  createSession,
  validateSession,
  revokeSession,
} from '@/lib/session';

describe('generateSecureToken', () => {
  it('returns a 64-char hex string (256 bits)', () => {
    const token = generateSecureToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates unique tokens', () => {
    const a = generateSecureToken();
    const b = generateSecureToken();
    expect(a).not.toBe(b);
  });
});

describe('createSession', () => {
  beforeEach(() => {
    mockDb.session.create.mockReset();
    mockDb.session.create.mockResolvedValue({});
  });

  it('returns a raw token and expiry date', async () => {
    const result = await createSession();
    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('stores hashed token in DB (not raw)', async () => {
    const result = await createSession();
    expect(mockDb.session.create).toHaveBeenCalledOnce();
    const callData = mockDb.session.create.mock.calls[0][0].data;
    // Stored token should be a SHA-256 hex hash, not the raw token
    expect(callData.token).toMatch(/^[a-f0-9]{64}$/);
    expect(callData.token).not.toBe(result.token);
  });

  it('passes IP and user agent metadata', async () => {
    await createSession({ ipAddress: '1.2.3.4', userAgent: 'TestAgent' });
    const callData = mockDb.session.create.mock.calls[0][0].data;
    expect(callData.ipAddress).toBe('1.2.3.4');
    expect(callData.userAgent).toBe('TestAgent');
  });

  it('defaults metadata to null', async () => {
    await createSession();
    const callData = mockDb.session.create.mock.calls[0][0].data;
    expect(callData.ipAddress).toBeNull();
    expect(callData.userAgent).toBeNull();
  });
});

describe('validateSession', () => {
  beforeEach(() => {
    mockDb.session.findUnique.mockReset();
    mockDb.session.delete.mockReset();
  });

  it('returns true for valid non-expired session', async () => {
    mockDb.session.findUnique.mockResolvedValue({
      token: 'hash',
      expiresAt: new Date(Date.now() + 86400000), // tomorrow
    });
    const result = await validateSession('raw-token');
    expect(result).toBe(true);
  });

  it('returns false for non-existent session', async () => {
    mockDb.session.findUnique.mockResolvedValue(null);
    const result = await validateSession('unknown-token');
    expect(result).toBe(false);
  });

  it('returns false and deletes expired session', async () => {
    mockDb.session.findUnique.mockResolvedValue({
      token: 'hash',
      expiresAt: new Date(Date.now() - 1000), // past
    });
    mockDb.session.delete.mockResolvedValue({});
    const result = await validateSession('expired-token');
    expect(result).toBe(false);
    expect(mockDb.session.delete).toHaveBeenCalled();
  });
});

describe('revokeSession', () => {
  beforeEach(() => {
    mockDb.session.delete.mockReset();
  });

  it('deletes session by hashed token', async () => {
    mockDb.session.delete.mockResolvedValue({});
    await revokeSession('raw-token');
    expect(mockDb.session.delete).toHaveBeenCalledOnce();
    const whereClause = mockDb.session.delete.mock.calls[0][0].where;
    // Should hash the raw token for lookup
    expect(whereClause.token).toMatch(/^[a-f0-9]{64}$/);
    expect(whereClause.token).not.toBe('raw-token');
  });
});
