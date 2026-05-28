import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { midtransService } from '../services/midtrans.service.js';
import { slotRedisService } from '../services/redis-slot.service.js';
import { prisma } from '../db/index.js';
import { logger } from '../libs/logger.js';
import { ticketService } from '../services/ticket.service.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../constants/status.js';

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

  const order = payment.order;
  if (!order) {
    logger.warn({ providerOrderId }, 'Payment order not found for webhook');
    res.json({ status: 'ok' });
    return;
  }

  if (order.status == ORDER_STATUS.PAID) {
    logger.info('Order has been paid');
    res.json({ status: 'ok' });
    return;
  }

  if (transaction_status === 'settlement' || transaction_status === 'capture') {
    if (fraud_status === 'accept' || fraud_status === 'challenge') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PAYMENT_STATUS.SETTLEMENT,
            paymentType: payment_type,
            providerTransactionId: transaction_id,
            rawNotification: req.body,
            paidAt: new Date(),
          },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: ORDER_STATUS.PAID,
            paidAt: new Date(),
          },
        });

        const tickets = await ticketService.generateTickets(order.id, order.eventId, order.userId, order.quantity);
        await tx.ticket.createMany({ data: tickets });
      });

      if (order.eventId && order.reservationId) {
        await slotRedisService.deleteReservation(order.eventId, order.reservationId);
      }
    }
  } else if (['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: transaction_status === 'expire' ? PAYMENT_STATUS.EXPIRED : PAYMENT_STATUS.FAILED,
          paymentType: payment_type,
          providerTransactionId: transaction_id,
          rawNotification: req.body,
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: ORDER_STATUS.FAILED },
      });
    });

    await slotRedisService.releaseSlot(order.eventId, order.quantity);
    await slotRedisService.deleteReservation(order.eventId, order.reservationId!);
  } else {
    logger.info({ transaction_status }, 'Unhandled transaction status');
  }

  res.json({ status: 'ok' });
});
