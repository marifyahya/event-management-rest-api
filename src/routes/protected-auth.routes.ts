import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

const protectedAuthRouter = Router();

protectedAuthRouter.get('/me', authController.me);
protectedAuthRouter.post('/logout', authController.logout);

export default protectedAuthRouter;
