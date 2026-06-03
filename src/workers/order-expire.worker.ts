import 'dotenv/config';
import { Worker } from 'bullmq';
import { prisma } from '../db/index.js';
import { logger } from '../libs/logger.js';
import { redisConnection } from '../libs/redis.js';
import { releaseReservation } from '../libs/reservation.js';
import { ORDER_STATUS } from '../constants/order-status.js';
import { PAYMENT_STATUS } from '../constants/payment-status.js';
import { ORDER_EXPIRE_QUEUE_NAME, type OrderExpireJobData } from '../queues/order-expire.queue.js';

const worker = new Worker<OrderExpireJobData>(
  ORDER_EXPIRE_QUEUE_NAME,
  async (job) => {
    const { orderId } = job.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      logger.info({ orderId }, 'Order not found, skipping expiration');
      return { orderId, status: 'not_found' };
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      logger.info({ orderId, status: order.status }, 'Order already processed, skipping expiration');
      return { orderId, status: 'skipped' };
    }

    await prisma.$transaction(async (tx) => {
      const updateResult = await tx.order.updateMany({
        where: { id: orderId, status: ORDER_STATUS.PENDING },
        data: { status: ORDER_STATUS.EXPIRED },
      });

      if (updateResult.count === 0) {
        throw new Error('Order status changed during expiration process');
      }

      if (order.payment) {
        await tx.payment.updateMany({
          where: { id: order.payment.id, status: PAYMENT_STATUS.PENDING },
          data: { status: PAYMENT_STATUS.EXPIRE },
        });
      }
    });

    const released = await releaseReservation(order.eventId, order.orderNumber);

    if (released) {
      logger.info({ orderNumber: order.orderNumber, eventId: order.eventId }, 'Stock released for expired order');
    } else {
      logger.warn({ orderNumber: order.orderNumber }, 'Reservation already expired or released');
    }

    return {
      orderId,
      orderNumber: order.orderNumber,
      status: ORDER_STATUS.EXPIRED,
      stockReleased: released,
    };
  },
  {
    connection: redisConnection,
    concurrency: 3,
  },
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'order-expire job completed');
});

worker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, err: error }, 'order-expire job failed');
});

async function shutdown() {
  await worker.close();
  await prisma.$disconnect();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
