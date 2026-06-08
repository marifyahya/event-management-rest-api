import { prisma } from '../db/index.js';
import { logger } from '../libs/logger.js';
import { paymentService } from './payment.service.js';
import { ORDER_STATUS } from '../constants/order-status.js';
import { PAYMENT_STATUS } from '../constants/payment-status.js';
import { TICKET_STATUS } from '../constants/ticket-status.js';
import { confirmReservation, releaseReservation } from '../libs/reservation.js';
import { BadRequest } from '../utils/app-error.js';
import { generateTicketCode, generateQrToken } from '../utils/ticket.js';
import { generatePdfQueue } from '../queues/generate-pdf.queue.js';
import { getRedisClient } from '../libs/redis.js';

class PaymentWebhookService {
  /**
   * Process an incoming webhook payload from the active payment provider.
   * Verifies the signature, maps status, then updates Order + Payment + issues Tickets.
   *
   * @param payload - Raw JSON body from the provider
   * @param signatureStr - Provider-specific signature header value (if any)
   */
  async handle(payload: any, signatureStr?: string): Promise<void> {
    const isValid = paymentService.verifyWebhookSignature(payload, signatureStr);
    if (!isValid) {
      logger.warn({ payload }, 'Webhook signature verification failed');
      throw new BadRequest('Invalid webhook signature');
    }

    const parsed = paymentService.parseWebhookPayload(payload);
    const { orderNumber, status, providerTransactionId, rawPayload } = parsed;

    logger.info({ orderNumber, status }, 'Webhook parsed successfully');

    const redis = getRedisClient();
    const lockKey = `lock:webhook:order:${orderNumber}`;
    const lockAcquired = await redis.set(lockKey, 'LOCKED', 'EX', 15, 'NX');

    if (!lockAcquired) {
      logger.warn({ orderNumber }, 'Webhook is processing concurrently, ignoring duplicate request');
      return;
    }

    try {
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: { payment: true, user: true, event: true },
      });

      if (!order) {
        logger.warn({ orderNumber }, 'Webhook received for unknown order, skipping');
        return;
      }

      if (
        order.status === ORDER_STATUS.PAID ||
        order.status === ORDER_STATUS.CANCELLED ||
        order.status === ORDER_STATUS.EXPIRED
      ) {
        logger.info({ orderNumber, status: order.status }, 'Order already in terminal state, skipping webhook');
        return;
      }

      if (status === 'PAID') {
        await this.handlePaid(order, rawPayload, providerTransactionId);
      } else if (status === 'EXPIRED') {
        await this.handleExpired(order, rawPayload);
      } else if (status === 'CANCELLED') {
        await this.handleCancelled(order, rawPayload);
      } else {
        logger.info({ orderNumber, status }, 'Webhook status is PENDING, no action taken');
      }
    } finally {
      await redis.del(lockKey);
    }
  }

  private async handlePaid(
    order: Awaited<ReturnType<typeof prisma.order.findUnique>> & { payment: any; user: any; event: any },
    rawPayload: any,
    providerTransactionId?: string,
  ): Promise<void> {
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { orderId: order!.id },
        data: {
          status: PAYMENT_STATUS.PAID,
          paidAt: now,
          providerTransactionId: providerTransactionId ?? null,
          rawNotification: rawPayload,
        },
      });

      await tx.order.update({
        where: { id: order!.id },
        data: {
          status: ORDER_STATUS.PAID,
          paidAt: now,
        },
      });

      const ticketData = Array.from({ length: order!.quantity }, () => ({
        orderId: order!.id,
        eventId: order!.eventId,
        userId: order!.userId,
        ticketCode: generateTicketCode(),
        qrToken: generateQrToken(),
        status: TICKET_STATUS.VALID,
      }));

      await tx.ticket.createMany({ data: ticketData });
    });

    await confirmReservation(order!.orderNumber);

    await generatePdfQueue.add('generate-pdf', {
      orderNumber: order.orderNumber,
    });

    logger.info({ orderNumber: order.orderNumber }, 'Payment confirmed, tickets issued, and PDF generation enqueued');
  }

  private async handleExpired(
    order: Awaited<ReturnType<typeof prisma.order.findUnique>>,
    rawPayload: any,
  ): Promise<void> {
    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId: order!.id },
        data: { status: PAYMENT_STATUS.EXPIRE, rawNotification: rawPayload },
      }),
      prisma.order.update({
        where: { id: order!.id },
        data: { status: ORDER_STATUS.EXPIRED },
      }),
    ]);

    logger.info({ orderNumber: order!.orderNumber }, 'Order expired via webhook');

    await releaseReservation(order!.eventId, order!.orderNumber);

    logger.info({ orderNumber: order!.orderNumber, eventId: order!.eventId }, 'Stock restored to Redis (expired)');
  }

  private async handleCancelled(
    order: Awaited<ReturnType<typeof prisma.order.findUnique>>,
    rawPayload: any,
  ): Promise<void> {
    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId: order!.id },
        data: { status: PAYMENT_STATUS.CANCEL, rawNotification: rawPayload },
      }),
      prisma.order.update({
        where: { id: order!.id },
        data: { status: ORDER_STATUS.CANCELLED },
      }),
    ]);

    logger.info({ orderNumber: order!.orderNumber }, 'Order cancelled via webhook');

    await releaseReservation(order!.eventId, order!.orderNumber);

    logger.info({ orderNumber: order!.orderNumber, eventId: order!.eventId }, 'Stock restored to Redis (cancelled)');
  }
}

export const paymentWebhookService = new PaymentWebhookService();
