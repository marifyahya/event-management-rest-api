import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import authRouter from './auth.routes.js';
import protectedAuthRouter from './protected-auth.routes.js';
import userRouter from './user.routes.js';
import eventRouter from './event.routes.js';
import publicEventRouter from './public-event.routes.js';
import orderRouter from './order.routes.js';

const router = Router();
const protectedRouter = Router();

protectedRouter.use(authMiddleware);

router.get('/health', (_req, res) => {
  res.json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
  });
});

router.use('/events', publicEventRouter);
router.use('/auth', authRouter);
protectedRouter.use('/auth', protectedAuthRouter);
protectedRouter.use('/users', userRouter);
protectedRouter.use('/orders', orderRouter);
protectedRouter.use('/admin/events', eventRouter);

router.use(protectedRouter);

export default router;
