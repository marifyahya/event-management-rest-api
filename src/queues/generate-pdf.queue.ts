import { Queue } from 'bullmq';
import { redisConnection } from '../libs/redis.js';

export type GeneratePdfJobData = {
  orderNumber: string;
};

export const GENERATE_PDF_QUEUE_NAME = 'generate-pdf';

export const generatePdfQueue = new Queue<GeneratePdfJobData>(GENERATE_PDF_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 500,
    removeOnFail: 2000,
  },
});
