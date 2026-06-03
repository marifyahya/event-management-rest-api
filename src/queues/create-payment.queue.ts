import { Queue } from 'bullmq';
import { redisConnection } from '../libs/redis.js';

export type CreatePaymentJobData = {
  orderId: string;
  paymentMethod: string;
};

export const CREATE_PAYMENT_QUEUE_NAME = 'create-payment';

export const createPaymentQueue = new Queue<CreatePaymentJobData>(CREATE_PAYMENT_QUEUE_NAME, {
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
