import { Router } from 'express';

const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
  });
});

export default apiRouter;
