import 'dotenv/config';
import { Worker } from 'bullmq';
import { prisma } from '../db/index.js';
import { logger } from '../libs/logger.js';
import { redisConnection } from '../libs/redis.js';
import { ORDER_STATUS } from '../constants/order-status.js';
import { PAYMENT_STATUS } from '../constants/payment-status.js';
import { midtransService } from '../services/midtrans.service.js';
import { CREATE_PAYMENT_QUEUE_NAME, type CreatePaymentJobData } from '../queues/create-payment.queue.js';
import { RESERVATION_TTL } from '../libs/reservation.js';

const worker = new Worker<CreatePaymentJobData>(
  CREATE_PAYMENT_QUEUE_NAME,
  async (job) => {
    const { orderId, paymentMethod } = job.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId, status: ORDER_STATUS.PENDING },
      include: { event: true, user: true },
    });

    if (!order) {
      logger.info({ orderId }, 'Order not found or not pending, skipping');
      return { orderId, status: 'not_found' };
    }

    const midtransResponse = await midtransService.createTransaction({
      orderNumber: order.orderNumber,
      grossAmount: order.totalAmount,
      customerName: order.user.fullName,
      customerEmail: order.user.email,
      eventTitle: order.event.title,
      quantity: order.quantity,
      ticketPrice: order.event.price,
      adminFee: order.adminFee,
      expiryDurationMinutes: Math.ceil(RESERVATION_TTL / 60),
      paymentMethod,
    });

    const payment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          snapToken: midtransResponse.token,
          snapRedirectUrl: midtransResponse.redirectUrl,
          status: PAYMENT_STATUS.PENDING,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          providerOrderId: order.orderNumber,
          grossAmount: order.totalAmount,
          snapToken: midtransResponse.token,
          snapRedirectUrl: midtransResponse.redirectUrl,
          status: PAYMENT_STATUS.PENDING,
          paymentMethod,
        },
      });
    }

    return {
      orderId,
      snapToken: midtransResponse.token,
      status: PAYMENT_STATUS.PENDING,
    };
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'create-payment job completed');
});

worker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, err: error }, 'create-payment job failed');
});

async function shutdown() {
  await worker.close();
  await prisma.$disconnect();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
