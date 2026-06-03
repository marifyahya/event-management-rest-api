import z from 'zod';
import { ENABLED_PAYMENTS_VALUES } from '../constants/payment-method.js';

export const orderEventSchema = z.object({
  body: z.object({
    eventId: z.number(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(6, 'Max 6 tickets per purchase'),
    paymentMethod: z.enum(ENABLED_PAYMENTS_VALUES),
  }),
});
