import 'dotenv/config';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './libs/logger.js';
import { slotRedisService } from './services/redis-slot.service.js';
import { prisma } from './db/index.js';
import { EVENT_STATUS } from './constants/event-status.js';

async function seedSlotCounters() {
  try {
    const events = await prisma.event.findMany({
      where: { status: EVENT_STATUS.PUBLISHED },
      select: { id: true, capacity: true },
    });

    for (const event of events) {
      const usedCount = await prisma.registration.count({
        where: {
          eventId: event.id,
          status: { not: 'cancelled' },
        },
      });
      await slotRedisService.seedSlot(event.id, event.capacity, usedCount);
    }

    logger.info(`Seeded ${events.length} event slot counters`);
  } catch (err) {
    logger.error({ err }, 'Failed to seed slot counters');
  }
}

const PORT = env.port;

app.listen(PORT, async () => {
  await seedSlotCounters();
  logger.info(`Server running on http://localhost:${PORT}`);
});
