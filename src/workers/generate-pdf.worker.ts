import { Worker, Job } from 'bullmq';
import { redisConnection } from '../libs/redis.js';
import { logger } from '../libs/logger.js';
import { prisma } from '../db/index.js';
import { GENERATE_PDF_QUEUE_NAME, GeneratePdfJobData } from '../queues/generate-pdf.queue.js';
import { pdfService } from '../services/pdf.service.js';
import { emailService } from '../services/email.service.js';
import { PaymentSuccessEmail } from '../emails/payment-success.email.js';
import { PaymentSuccessTemplateData } from '../templates/payment-success.template.js';

/**
 * Worker for generating PDF tickets asynchronously.
 */
export const generatePdfWorker = new Worker<GeneratePdfJobData>(
  GENERATE_PDF_QUEUE_NAME,
  async (job: Job<GeneratePdfJobData>) => {
    const { orderNumber } = job.data;
    logger.info({ orderNumber, jobId: job.id }, 'Processing generate-pdf job');

    try {
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          user: true,
          event: true,
          tickets: true,
        },
      });

      if (!order) {
        throw new Error(`Order ${orderNumber} not found`);
      }

      // Map data for template
      const templateData: PaymentSuccessTemplateData = {
        to: order.user.email,
        customerName: order.user.fullName,
        orderNumber: order.orderNumber,
        eventTitle: order.event.title,
        eventLocation: order.event.location,
        eventStartAt: order.event.startAt,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        tickets: order.tickets.map((t: any) => ({
          ticketCode: t.ticketCode,
          qrToken: t.qrToken,
        })),
      };

      let pdfUrl: string | undefined = undefined;

      try {
        pdfUrl = await pdfService.generateAndUploadTicketPdf(templateData, order.orderNumber);

        await prisma.order.update({
          where: { id: order.id },
          data: { ticketPdfUrl: pdfUrl },
        });
      } catch (pdfError) {
        logger.error(
          { error: pdfError, orderNumber },
          'Failed to generate PDF, continuing with Email sending as fallback',
        );
      }

      await emailService.sendAsync(
        new PaymentSuccessEmail({
          ...templateData,
          pdfUrl,
        }),
      );

      logger.info({ orderNumber, pdfUrl, jobId: job.id }, 'Generate PDF job completed and email enqueued');
    } catch (error) {
      logger.error({ error, orderNumber, jobId: job.id }, 'Fatal error in generate-pdf worker');
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  },
);

generatePdfWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Generate PDF job failed in worker');
});
