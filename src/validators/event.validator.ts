import z from 'zod';
import { EVENT_STATUS_VALUES } from '../constants/event-status.js';
import { dateTimeSchema } from './common.validator.js';

export const storeEventSchema = z.object({
  body: z
    .object({
      title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be at most 100 characters'),
      description: z.string().max(500, 'Description must be at most 500 characters').optional(),
      capacity: z.number().int().min(1, 'Capacity must be at least 1'),
      category: z.string().max(100, 'Category must be at most 100 characters').optional(),
      location: z.string().max(200, 'Location must be at most 200 characters'),
      startAt: dateTimeSchema,
      endAt: dateTimeSchema,
    })
    .superRefine((data, ctx) => {
      const startAt = new Date(data.startAt.replace(' ', 'T') + ':00');
      const endAt = new Date(data.endAt.replace(' ', 'T') + ':00');
      const now = new Date();

      if (startAt <= now) {
        ctx.addIssue({
          code: 'custom',
          message: 'Start date must be in the future',
          path: ['startAt'],
        });
      }

      if (endAt <= now) {
        ctx.addIssue({
          code: 'custom',
          message: 'End date must be in the future',
          path: ['endAt'],
        });
      }

      if (endAt <= startAt) {
        ctx.addIssue({
          code: 'custom',
          message: 'End date must be after start date',
          path: ['endAt'],
        });
      }
    }),
});
