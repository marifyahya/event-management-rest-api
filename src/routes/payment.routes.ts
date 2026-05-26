import { Router } from 'express';
import { handleWebhook } from '../controllers/payment.controller.js';

const paymentRoutes = Router();

paymentRoutes.post('/midtrans/webhook', handleWebhook);

export default paymentRoutes;
