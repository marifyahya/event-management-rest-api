import 'dotenv/config';
import { Worker } from 'bullmq';
import { env } from '../config/env.js';
import { prisma } from '../db/index.js';
import { redisConnection } from '../libs/redis.js';
import { midtransService } from '../services/midtrans.service.js';
import type { CreateOrderJobData } from '../queues/create-order.queue.js';

const worker = new Worker<CreateOrderJobData>(
  env.createOrderQueueName,
  async (job) => {
    const { reservationId, eventId, userId, quantity } = job.data;

    const existingOrder = await prisma.order.findUnique({
      where: { reservationId },
      include: { payment: true },
    });

    if (existingOrder) {
      return {
        orderId: existingOrder.id,
        snapToken: existingOrder.payment?.snapToken,
        snapRedirectUrl: existingOrder.payment?.snapRedirectUrl,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { price: true },
      });

      const registration = await tx.registration.create({
        data: {
          eventId,
          userId,
          status: 'registered',
        },
      });

      const orderNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const subtotalAmount = (event?.price || 0) * quantity;
      const totalAmount = subtotalAmount;

      const order = await tx.order.create({
        data: {
          registrationId: registration.id,
          eventId,
          userId,
          orderNumber,
          status: 'pending',
          reservationId,
          quantity,
          subtotalAmount,
          adminFee: 0,
          totalAmount,
        },
      });

      const { snapToken, snapRedirectUrl } = await midtransService.createTransaction(order.id, order.totalAmount);

      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: 'midtrans',
          providerOrderId: order.id,
          status: 'pending',
          grossAmount: order.totalAmount,
          snapToken,
          snapRedirectUrl,
        },
      });

      return { orderId: order.id, snapToken, snapRedirectUrl };
    });

    return result;
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

worker.on('completed', (job) => {
  console.log(`create-order job completed: ${job.id}`);
});

worker.on('failed', (job, error) => {
  console.error(`create-order job failed: ${job?.id}`, error);
});

async function shutdown() {
  await worker.close();
  await redisConnection.quit();
  await prisma.$disconnect();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
