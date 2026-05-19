export const env = {
  nodeEnv: process.env.NODE_ENV || 'local',
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  createOrderQueueName: process.env.QUEUE_CREATE_ORDER_NAME || 'create-order',
};
