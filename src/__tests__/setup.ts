import { vi } from 'vitest';
import './mock-prisma.js';

// Mock BullMQ Queue so it doesn't try to connect to Redis
vi.mock('bullmq', () => {
  class MockQueue {
    add = vi.fn().mockResolvedValue({ id: 'mock-job-id' });
  }
  class MockWorker {
    on = vi.fn();
    close = vi.fn();
  }
  return { Queue: MockQueue, Worker: MockWorker };
});

// Mock Redis client
vi.mock('../libs/redis.js', () => ({
  getRedisClient: vi.fn(() => ({
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    setnx: vi.fn().mockResolvedValue(1),
    eval: vi.fn().mockResolvedValue(1),
    incrby: vi.fn().mockResolvedValue(1),
    quit: vi.fn(),
  })),
  redisConnection: {},
}));
