import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest } from '../helpers/request';

vi.mock('@/lib/session', () => ({
  validateSession: vi.fn().mockResolvedValue(true),
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

// Mock the TaskStatus/TaskPriority types (they're just string enums)
vi.mock('@/types/tasks', () => ({
  TaskStatus: {},
  TaskPriority: {},
}));

import { GET, POST } from '@/app/api/tasks/route';

function authedRequest(opts: Parameters<typeof createMockRequest>[0] = {}) {
  return createMockRequest({
    ...opts,
    cookies: { dashboard_session_token: 'valid', ...opts.cookies },
  });
}

describe('GET /api/tasks', () => {
  beforeEach(() => {
    mockDb.task.findMany.mockReset().mockResolvedValue([]);
  });

  it('returns tasks list', async () => {
    const tasks = [{ id: '1', title: 'Test', status: 'TODO' }];
    mockDb.task.findMany.mockResolvedValue(tasks);

    const req = authedRequest({ url: 'http://localhost:3000/api/tasks' });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items).toEqual(tasks);
  });

  it('filters by status', async () => {
    const req = authedRequest({
      url: 'http://localhost:3000/api/tasks?status=TODO,IN_PROGRESS',
    });
    await GET(req);
    const where = mockDb.task.findMany.mock.calls[0][0].where;
    expect(where.status).toEqual({ in: ['TODO', 'IN_PROGRESS'] });
  });

  it('filters by category', async () => {
    const req = authedRequest({
      url: 'http://localhost:3000/api/tasks?category=work',
    });
    await GET(req);
    const where = mockDb.task.findMany.mock.calls[0][0].where;
    expect(where.category).toBe('work');
  });

  it('applies search filter', async () => {
    const req = authedRequest({
      url: 'http://localhost:3000/api/tasks?search=deploy',
    });
    await GET(req);
    const where = mockDb.task.findMany.mock.calls[0][0].where;
    expect(where.OR).toHaveLength(2);
  });
});

describe('POST /api/tasks', () => {
  beforeEach(() => {
    mockDb.task.findFirst.mockReset().mockResolvedValue(null);
    mockDb.task.create.mockReset().mockResolvedValue({
      id: 'new-1',
      title: 'New Task',
      status: 'TODO',
      priority: 'MEDIUM',
      position: 0,
    });
  });

  it('creates task with defaults and position 0 when no existing tasks', async () => {
    const req = authedRequest({
      url: 'http://localhost:3000/api/tasks',
      body: { title: 'New Task' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const createCall = mockDb.task.create.mock.calls[0][0].data;
    expect(createCall.status).toBe('TODO');
    expect(createCall.priority).toBe('MEDIUM');
    expect(createCall.position).toBe(0);
  });

  it('calculates next position from existing tasks', async () => {
    mockDb.task.findFirst.mockResolvedValue({ position: 5 });
    const req = authedRequest({
      url: 'http://localhost:3000/api/tasks',
      body: { title: 'Another Task' },
    });
    await POST(req);
    const createCall = mockDb.task.create.mock.calls[0][0].data;
    expect(createCall.position).toBe(6);
  });
});
