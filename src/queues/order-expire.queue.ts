import { Queue } from 'bullmq';
import { redisConnection } from '../libs/redis.js';

export type OrderExpireJobData = { orderId: string };

export const ORDER_EXPIRE_QUEUE_NAME = 'order-expire';

export const orderExpireQueue = new Queue<OrderExpireJobData>(ORDER_EXPIRE_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});
