import { jwt } from 'zod';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  midtransServerKey: process.env.MIDTRANS_SERVER_KEY || '',
  midtransClientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  midtransIsProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
};
