import express, { Request, Response } from 'express';
import apiRouter from './routes/api.js';

const app = express();

app.use(express.json());

app.use('/api', apiRouter);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to API Auth Express',
  });
});

export default app;
