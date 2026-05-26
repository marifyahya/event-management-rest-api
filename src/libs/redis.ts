import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export const redisClient = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
});

redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis successfully');
});

redisClient.on('reconnecting', () => {
  logger.warn('Reconnecting to Redis...');
});

redisClient.on('end', () => {
  logger.warn('Redis connection closed');
});

export const redisConnection = new Redis(env.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});
