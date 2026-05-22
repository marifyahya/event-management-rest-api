import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { loginUserSchema, registerUserSchema } from '../validators/user.validator.js';
import * as authController from '../controllers/auth.controller.js';

const authRouter = Router();

authRouter.post('/register', validate(registerUserSchema), authController.register);
authRouter.post('/login', validate(loginUserSchema), authController.login);

export default authRouter;
