import 'dotenv/config';
import app from './app.js';
import { logger } from './libs/logger.js';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
