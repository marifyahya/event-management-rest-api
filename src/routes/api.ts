import { Router } from 'express';

import {
  indexUserSchema,
  loginUserSchema,
  registerUserSchema,
  storeUserSchema,
  updateUserSchema,
} from '../validators/user.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleAdminMiddleware } from '../middleware/role-admin.middleware.js';

import * as authController from '../controllers/auth.controller.js';
import * as userController from '../controllers/user.controller.js';

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
router.post('/auth/login', validate(loginUserSchema), authController.login);

protectedRouter.get('/auth/me', authController.me);
protectedRouter.post('/auth/logout', authController.logout);

protectedRouter.use('/users', roleAdminMiddleware);
protectedRouter.get('/users', validate(indexUserSchema), userController.index);
protectedRouter.get('/users/:id', userController.show);
protectedRouter.post('/users', validate(storeUserSchema), userController.store);
protectedRouter.patch('/users/:id', validate(updateUserSchema), userController.update);
protectedRouter.delete('/users/:id', userController.destroy);

router.use(protectedRouter);

export default router;
