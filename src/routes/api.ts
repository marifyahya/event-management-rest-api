import { Router } from 'express';

import { registerUserSchema } from '../validators/user.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

import * as authController from '../controllers/auth.controller.js';

const router = Router();
const protectedRouter = Router();

protectedRouter.use(authMiddleware);

router.get('/health', (_req, res) => {
  res.json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
  });
});

router.post('/auth/register', validate(registerUserSchema), authController.register);
router.post('/auth/login', authController.login);

protectedRouter.get('/auth/me', authController.me);
protectedRouter.post('/auth/logout', authController.logout);

router.use(protectedRouter);

export default router;
