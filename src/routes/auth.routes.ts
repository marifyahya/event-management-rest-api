import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { loginUserSchema, registerUserSchema } from '../validators/user.validator.js';
import * as authController from '../controllers/auth.controller.js';
import { authRateLimiter } from '../middleware/rate-limiter.middleware.js';

const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate(registerUserSchema), authController.register);
authRouter.post('/login', authRateLimiter, validate(loginUserSchema), authController.login);

export default authRouter;
