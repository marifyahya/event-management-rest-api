import 'dotenv/config';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './libs/logger.js';
import { eventService } from './services/event.service.js';

const PORT = env.port;

app.listen(PORT, async () => {
  await eventService.seedSlotCounters();
  logger.info(`Server running on http://localhost:${PORT}`);
});
