import express, { Request, Response } from 'express';
import apiRouter from './routes/api.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware.js';
import { requestLogger } from './middleware/request-logger.middleware.js';
import path from 'path';

const app = express();

app.use(requestLogger);
app.use(express.json());

// Serve static files (Local Storage)
app.use('/public', express.static(path.join(process.cwd(), 'public')));

app.use('/api', apiRouter);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to API Auth Express',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
