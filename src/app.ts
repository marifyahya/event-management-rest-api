import express, { Request, Response } from 'express';
import apiRouter from './routes/api.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware.js';
import { requestLogger } from './middleware/request-logger.middleware.js';
import path from 'path';
import { globalRateLimiter } from './middleware/rate-limiter.middleware.js';

import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const app = express();

app.set('trust proxy', 1);

app.use(requestLogger);
app.use(express.json());

// Load OpenAPI spec
const swaggerDocument = YAML.load(path.join(process.cwd(), 'openapi.yaml'));
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Event Organizer API Docs',
  }),
);

// Serve static files (Local Storage)
app.use('/public', express.static(path.join(process.cwd(), 'public')));

app.use('/api', globalRateLimiter, apiRouter);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to API Auth Express',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
