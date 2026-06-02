import 'dotenv/config';
import { Worker } from 'bullmq';
import { env } from '../config/env.js';
import { prisma } from '../db/index.js';
import { redisConnection } from '../libs/redis.js';
import type { CreateOrderJobData } from '../queues/create-order.queue.js';

const worker = new Worker<CreateOrderJobData>(
  env.createOrderQueueName,
  async (job) => {
    const { reservationId, eventId, userId, quantity, slotIds } = job.data;

    // TODO: Epic 3 implementation:
    // 1. Create pending order using reservationId as idempotency key.
    // 2. Create Midtrans payment.
    // 3. Persist ticket_slots audit records as held.
    // 4. Return order/payment status for polling.
    await prisma.$transaction(async () => {
      void reservationId;
      void eventId;
      void userId;
      void quantity;
      void slotIds;
    });

    return {
      reservationId,
      status: 'processed',
    };
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
  await prisma.$disconnect();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
