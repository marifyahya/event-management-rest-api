import 'dotenv/config';
import app from './app.js';
import { logger } from './libs/logger.js';
import { syncAllPublishedStock } from './libs/stock-sync.js';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, async () => {
  await syncAllPublishedStock();
  logger.info(`Server running on http://localhost:${PORT}`);
});
