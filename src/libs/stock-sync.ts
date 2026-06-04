import { prisma } from '../db/index.js';
import { logger } from './logger.js';
import { initEventStock } from './reservation.js';
import { EVENT_STATUS } from '../constants/event-status.js';
import { ORDER_STATUS } from '../constants/order-status.js';

/**
 * Sync stock for all published events from PostgreSQL to Redis on startup.
 *
 * Uses SET NX so keys that already exist in Redis (active sessions) are skipped.
 * Available stock = capacity - SUM(quantity from PAID + PENDING orders).
 */
export async function syncAllPublishedStock(): Promise<void> {
  logger.info('Syncing published event stock to Redis...');

  const events = await prisma.event.findMany({
    where: { status: EVENT_STATUS.PUBLISHED },
    select: {
      id: true,
      capacity: true,
      orders: {
        where: {
          status: { in: [ORDER_STATUS.PAID, ORDER_STATUS.PENDING] },
        },
        select: { quantity: true },
      },
    },
  });

  let synced = 0;
  let skipped = 0;

  for (const event of events) {
    const soldQuantity = event.orders.reduce((sum, order) => sum + order.quantity, 0);
    const availableStock = Math.max(0, event.capacity - soldQuantity);

    const wasSet = await initEventStock(event.id, availableStock);

    if (wasSet) {
      logger.info({ eventId: event.id, availableStock }, 'Event stock synced');
      synced++;
    } else {
      logger.info({ eventId: event.id }, 'Event stock already in Redis, skipping');
      skipped++;
    }
  }

  logger.info({ total: events.length, synced, skipped }, 'Stock sync complete');
}
