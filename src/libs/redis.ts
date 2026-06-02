import type { ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';

let redisClient: Redis | null = null;

export const redisConnection: ConnectionOptions = {
  url: env.redisUrl,
  maxRetriesPerRequest: null,
};

export function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(env.redisUrl);
  }

  return redisClient;
}

export async function closeRedisClient() {
  if (!redisClient) {
    return;
  }

  const client = redisClient;
  redisClient = null;
  await client.quit();
}
