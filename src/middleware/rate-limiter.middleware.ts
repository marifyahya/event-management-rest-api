import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../libs/redis.js';
import { env } from '../config/env.js';

const isUnitTest = env.nodeEnv === 'test';

/**
 * Creates a unique RedisStore instance for a given namespace prefix.
 * Falls back to undefined (MemoryStore) in testing environment.
 */
const createRedisStore = (prefix: string) => {
  if (isUnitTest) {
    return undefined;
  }

  return new RedisStore({
    prefix: `rate-limit:${prefix}:`,
    // @ts-ignore
    sendCommand: (...args: string[]) => getRedisClient().call(args[0], ...args.slice(1)),
  });
};

/**
 * Global rate limiter to protect all public API endpoints.
 * Keys by IP + User-Agent to avoid locking public NAT router networks.
 */
export const globalRateLimiter = rateLimit({
  store: createRedisStore('global'),
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  skip: () => isUnitTest,
  keyGenerator: (req) => {
    const userAgent = req.headers['user-agent'] || '';
    const ip = ipKeyGenerator(req.ip || '');
    return `${ip}:${userAgent}`;
  },
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication routes (Register and Login).
 * Keys by IP + Email to prevent targeted credential stuffing attacks.
 */
export const authRateLimiter = rateLimit({
  store: createRedisStore('auth'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skip: () => isUnitTest,
  keyGenerator: (req) => {
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : '';
    const ip = ipKeyGenerator(req.ip || '');
    return `${ip}:${email}`;
  },
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Personal rate limiter for ticket order checkouts.
 * Keys by authenticated User ID.
 */
export const orderRateLimiter = rateLimit({
  store: createRedisStore('order'),
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  skip: () => isUnitTest,
  keyGenerator: (req) => {
    const userId = req.user?.id ? String(req.user.id) : '';
    const ip = ipKeyGenerator(req.ip || '');
    return userId ? userId : ip;
  },
  message: {
    success: false,
    error: {
      message: 'Too many purchase attempts. Please try again in a minute.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

