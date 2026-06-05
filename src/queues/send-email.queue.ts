import { Queue } from 'bullmq';
import type { MailerName } from '../emails/mailer-registry.js';
import { redisConnection } from '../libs/redis.js';

/**
 * Generic email job data.
 * Hanya menyimpan nama template (MailerName) dan raw payload (data).
 * HTML akan di-render di dalam worker untuk menghemat memori Redis.
 */
export type SendEmailJobData = {
  name: MailerName;
  payload: any;
  overrideTo?: string;
};

export const SEND_EMAIL_QUEUE_NAME = 'send-email';

export const sendEmailQueue = new Queue<SendEmailJobData>(SEND_EMAIL_QUEUE_NAME, {
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
