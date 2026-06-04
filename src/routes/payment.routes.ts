import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';

const paymentRouter = Router();

paymentRouter.post('/webhook', paymentController.webhook);

export default paymentRouter;
