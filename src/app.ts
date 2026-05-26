import express, { Request, Response } from 'express';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware.js';
import { requestLogger } from './middleware/request-logger.middleware.js';

const app = express();

app.use(requestLogger);
app.use(express.json());

app.use('/api', apiRouter);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to API Auth Express',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
