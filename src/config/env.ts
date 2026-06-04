import { jwt } from 'zod';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  reservationTtl: Number(process.env.RESERVATION_TTL) || 300,
  midtransApiUrl: process.env.MIDTRANS_API_URL || 'https://app.sandbox.midtrans.com/snap/v1/transactions',
  midtransServerKey: process.env.MIDTRANS_SERVER_KEY || '',
  midtransClientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  paymentGatewayProvider: process.env.PAYMENT_GATEWAY_PROVIDER || 'midtrans',
  xenditApiUrl: process.env.XENDIT_API_URL || 'https://api.xendit.co',
  xenditSecretKey: process.env.XENDIT_SECRET_KEY || '',
  xenditWebhookToken: process.env.XENDIT_WEBHOOK_TOKEN || '',
};
