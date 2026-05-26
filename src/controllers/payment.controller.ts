import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { asyncHandler } from '../utils/async-handler.js';
import { midtransService } from '../services/midtrans.service.js';
import { slotRedisService } from '../services/redis-slot.service.js';
import { prisma } from '../db/index.js';
import { logger } from '../libs/logger.js';

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const notification = await midtransService.handleNotification(req.body);
  const { order_id: providerOrderId, transaction_status, fraud_status, payment_type, transaction_id } = notification;

  logger.info({ providerOrderId, transaction_status, fraud_status }, 'Midtrans webhook received');

  const payment = await prisma.payment.findUnique({
    where: { providerOrderId },
    include: { order: true },
  });

  if (!payment) {
    logger.warn({ providerOrderId }, 'Payment not found for webhook');
    res.json({ status: 'ok' });
    return;
  }

  if (transaction_status === 'settlement' || transaction_status === 'capture') {
    if (fraud_status === 'accept' || fraud_status === 'challenge') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'settlement',
            paymentType: payment_type,
            providerTransactionId: transaction_id,
            rawNotification: req.body,
            paidAt: new Date(),
          },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'paid',
            paidAt: new Date(),
          },
        });

        const ticketCode = `TCK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const qrToken = randomUUID();

        await tx.ticket.create({
          data: {
            orderId: payment.orderId,
            eventId: payment.order!.eventId,
            userId: payment.order!.userId,
            ticketCode,
            qrToken,
            status: 'active',
          },
        });
      });

      if (payment.order?.eventId && payment.order?.reservationId) {
        await slotRedisService.deleteReservation(payment.order.eventId, payment.order.reservationId);
      }
    }
  } else if (['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: transaction_status === 'expire' ? 'expired' : 'failed',
          paymentType: payment_type,
          providerTransactionId: transaction_id,
          rawNotification: req.body,
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'failed' },
      });
    });

    if (payment.order?.eventId && payment.order?.reservationId) {
      await slotRedisService.releaseSlot(payment.order.eventId);
      await slotRedisService.deleteReservation(payment.order.eventId, payment.order.reservationId);
    }
  } else {
    logger.info({ transaction_status }, 'Unhandled transaction status');
  }

  res.json({ status: 'ok' });
});
