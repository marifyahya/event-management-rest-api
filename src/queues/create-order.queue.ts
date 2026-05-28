import { Queue } from 'bullmq';
import { env } from '../config/env.js';
import { redisConnection } from '../libs/redis.js';

export type CreateOrderJobData = {
  eventId: number;
  userId: number;
  reservationId: string;
  quantity: number;
};

export const createOrderQueue = new Queue<CreateOrderJobData>(env.createOrderQueueName, {
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
