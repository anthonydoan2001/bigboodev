import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest } from '../helpers/request';

// Mock dependencies before importing route handlers
const mockValidateSession = vi.hoisted(() => vi.fn().mockResolvedValue(true));
vi.mock('@/lib/session', () => ({
  validateSession: mockValidateSession,
}));

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

vi.mock('@/lib/db', () => ({ db: mockDb }));

import { GET, POST } from '@/app/api/notes/route';

function authedRequest(opts: Parameters<typeof createMockRequest>[0] = {}) {
  return createMockRequest({
    ...opts,
    cookies: { dashboard_session_token: 'valid', ...opts.cookies },
  });
}

describe('GET /api/notes', () => {
  beforeEach(() => {
    mockValidateSession.mockResolvedValue(true);
    mockDb.note.findMany.mockReset().mockResolvedValue([]);
    mockDb.note.groupBy.mockReset().mockResolvedValue([]);
  });

  it('returns notes with default filters (excludes deleted)', async () => {
    const mockNotes = [{ id: '1', title: 'Test', isDeleted: false }];
    mockDb.note.findMany.mockResolvedValue(mockNotes);

    const req = authedRequest({ url: 'http://localhost:3000/api/notes' });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items).toEqual(mockNotes);
    const where = mockDb.note.findMany.mock.calls[0][0].where;
    expect(where.isDeleted).toBe(false);
  });

  it('filters by folderId', async () => {
    const req = authedRequest({
      url: 'http://localhost:3000/api/notes?folderId=folder-1',
    });
    await GET(req);
    const where = mockDb.note.findMany.mock.calls[0][0].where;
    expect(where.folderId).toBe('folder-1');
  });

  it('filters pinned notes', async () => {
    const req = authedRequest({
      url: 'http://localhost:3000/api/notes?isPinned=true',
    });
    await GET(req);
    const where = mockDb.note.findMany.mock.calls[0][0].where;
    expect(where.isPinned).toBe(true);
  });

  it('applies search with OR condition', async () => {
    const req = authedRequest({
      url: 'http://localhost:3000/api/notes?search=hello',
    });
    await GET(req);
    const where = mockDb.note.findMany.mock.calls[0][0].where;
    expect(where.OR).toHaveLength(2);
    expect(where.OR[0].title.contains).toBe('hello');
  });

  it('includes counts when requested', async () => {
    mockDb.note.groupBy.mockResolvedValue([
      { isDeleted: false, _count: 10 },
      { isDeleted: true, _count: 3 },
    ]);

    const req = authedRequest({
      url: 'http://localhost:3000/api/notes?includeCounts=true',
    });
    const res = await GET(req);
    const body = await res.json();

    expect(body.counts).toEqual({ total: 10, trashed: 3 });
  });

  it('returns 401 without session cookie', async () => {
    const req = createMockRequest({ url: 'http://localhost:3000/api/notes' });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/notes', () => {
  beforeEach(() => {
    mockValidateSession.mockResolvedValue(true);
    mockDb.note.create.mockReset().mockResolvedValue({
      id: 'new-1',
      title: 'New Note',
      content: '',
      isPinned: false,
      isDeleted: false,
    });
  });

  it('creates a note with required title', async () => {
    const req = authedRequest({
      url: 'http://localhost:3000/api/notes',
      body: { title: 'New Note' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.item).toBeDefined();
    expect(mockDb.note.create).toHaveBeenCalledOnce();
  });

  it('returns 400 when title is missing', async () => {
    const req = authedRequest({
      url: 'http://localhost:3000/api/notes',
      body: { content: 'no title' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
