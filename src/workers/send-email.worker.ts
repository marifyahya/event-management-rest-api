import 'dotenv/config';
import { Worker } from 'bullmq';
import { redisConnection } from '../libs/redis.js';
import { logger } from '../libs/logger.js';
import { env } from '../config/env.js';
import { emailTransporter } from '../providers/email/nodemailer.provider.js';
import { SEND_EMAIL_QUEUE_NAME, type SendEmailJobData } from '../queues/send-email.queue.js';
import { mailerRegistry } from '../emails/mailer-registry.js';

/**
 * Email worker — sends generic emails from the send-email queue.
 * Resolves the email template class using the registry, avoiding
 */
const worker = new Worker<SendEmailJobData>(
  SEND_EMAIL_QUEUE_NAME,
  async (job) => {
    const { name, payload, overrideTo } = job.data;

    const MailerClass = mailerRegistry[name];
    if (!MailerClass) {
      throw new Error(`Mailer template '${name}' not found in registry`);
    }

    const mailable = new MailerClass(payload);
    const mailData = mailable.toMail();

    if (overrideTo) {
      mailData.to = overrideTo;
    }

    await emailTransporter.sendMail({
      from: env.smtpFrom,
      to: mailData.to,
      subject: mailData.subject,
      html: mailData.html,
    });

    logger.info({ to: mailData.to, subject: mailData.subject }, 'Email sent successfully via worker');
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'send-email job completed');
});

worker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, name: job?.data.name, err: error }, 'send-email job failed');
});

async function shutdown() {
  await worker.close();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
