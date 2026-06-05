import { logger } from '../libs/logger.js';
import { sendEmailQueue } from '../queues/send-email.queue.js';
import { emailTransporter } from '../providers/email/nodemailer.provider.js';
import { env } from '../config/env.js';

import type { MailerName } from '../emails/mailer-registry.js';

export interface Mailable {
  readonly name: MailerName;
  readonly payload: any;
  toMail(): {
    to: string;
    subject: string;
    html: string;
  };
}

class EmailService {
  async sendAsync(mailable: Mailable): Promise<void> {
    let targetTo = mailable.toMail().to;
    if (env.smtpToMail) {
      logger.info({ originalTo: targetTo, sinkTo: env.smtpToMail }, 'Redirecting email to dev sink');
      targetTo = env.smtpToMail;
    }

    const queueData = {
      name: mailable.name,
      payload: mailable.payload,
      overrideTo: env.smtpToMail ? env.smtpToMail : undefined,
    };

    sendEmailQueue
      .add(`mail-${mailable.name}-${Date.now()}`, queueData)
      .catch((err) => logger.error({ err, to: targetTo }, 'Failed to enqueue email'));
  }

  async sendSync(mailable: Mailable): Promise<void> {
    const mailData = mailable.toMail();

    if (env.smtpToMail) {
      logger.info({ originalTo: mailData.to, sinkTo: env.smtpToMail }, 'Redirecting email to dev sink');
      mailData.to = env.smtpToMail;
    }

    await emailTransporter.sendMail({
      from: env.smtpFrom,
      to: mailData.to,
      subject: mailData.subject,
      html: mailData.html,
    });

    logger.info({ to: mailData.to, subject: mailData.subject }, 'Email sent synchronously');
  }
}

export const emailService = new EmailService();
