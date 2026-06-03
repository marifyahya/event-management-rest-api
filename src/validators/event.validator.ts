import z from 'zod';
import { dateTimeSchema } from './common.validator.js';
import { EVENT_STATUS_VALUES } from '../constants/event-status.js';

export const storeEventSchema = z.object({
  body: z
    .object({
      title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be at most 100 characters'),
      description: z.string().max(500, 'Description must be at most 500 characters').optional(),
      capacity: z.number().int().min(1, 'Capacity must be at least 1'),
      price: z.number().int().min(1, 'Price must be a positive integer'),
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

export const updateEventSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .min(5, 'Title must be at least 5 characters')
        .max(100, 'Title must be at most 100 characters')
        .optional(),
      description: z.string().max(500, 'Description must be at most 500 characters').optional(),
      capacity: z.number().int().min(1, 'Capacity must be at least 1').optional(),
      price: z.number().int().min(1, 'Price must be a positive integer').optional(),
      category: z.string().max(100, 'Category must be at most 100 characters').optional(),
      location: z.string().max(200, 'Location must be at most 200 characters').optional(),
      startAt: dateTimeSchema.optional(),
      endAt: dateTimeSchema.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    })
    .superRefine((data, ctx) => {
      const now = new Date();

      const startAt = data.startAt ? new Date(data.startAt.replace(' ', 'T') + ':00') : null;
      const endAt = data.endAt ? new Date(data.endAt.replace(' ', 'T') + ':00') : null;

      if (startAt && startAt <= now) {
        ctx.addIssue({ code: 'custom', message: 'Start date must be in the future', path: ['startAt'] });
      }

      if (endAt && endAt <= now) {
        ctx.addIssue({ code: 'custom', message: 'End date must be in the future', path: ['endAt'] });
      }

      if (startAt && endAt && endAt <= startAt) {
        ctx.addIssue({ code: 'custom', message: 'End date must be after start date', path: ['endAt'] });
      }
    }),
});

export const cancelEventSchema = z.object({
  body: z.object({
    reason: z.string().max(120, 'Reason must be at most 120 characters').optional(),
  }),
});

export const eventListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().max(100).positive().optional(),
    title: z.string().optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    status: z.enum(EVENT_STATUS_VALUES).optional(),
  }),
});

export const orderEventSchema = z.object({
  body: z.object({
    eventId: z.number(),
    quantity: z.number().int().positive().max(6, 'Max 6 tickets per purchase'),
  }),
});
