import type { Request, Response } from 'express';
import { paymentWebhookService } from '../services/payment-webhook.service.js';
import { logger } from '../libs/logger.js';

export async function webhook(req: Request, res: Response): Promise<void> {
  const payload = req.body;

  const signatureHeader =
    (req.headers['x-callback-token'] as string | undefined) ?? (req.headers['x-signature'] as string | undefined);

  logger.info({ provider: process.env.PAYMENT_GATEWAY_PROVIDER }, 'Incoming payment webhook');

  try {
    await paymentWebhookService.handle(payload, signatureHeader);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Webhook processing error');
    res.status(200).json({ success: false });
  }
}
