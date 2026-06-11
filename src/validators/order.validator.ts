import z from 'zod';
import { ENABLED_PAYMENTS_VALUES } from '../constants/payment-method.js';
import { ORDER_STATUS, ORDER_STATUS_VALUES } from '../constants/order-status.js';

export const orderEventSchema = z.object({
  body: z.object({
    eventId: z.number(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(6, 'Max 6 tickets per purchase'),
    paymentMethod: z.enum(ENABLED_PAYMENTS_VALUES),
  }),
});

export const adminOrderListSchema = z.object({
  query: z.object({
    eventId: z
      .string()
      .transform((val) => Number(val))
      .optional(),
    status: z.enum(ORDER_STATUS_VALUES).optional(),
    export: z.enum(['csv', 'xlsx']).optional(),
    timezone: z.string().optional(),
    page: z
      .string()
      .transform((val) => Number(val))
      .optional(),
    limit: z
      .string()
      .transform((val) => Number(val))
      .optional(),
  }),
});
