import z from 'zod';

export const dateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/,
    'Format must be YYYY-MM-DD HH:mm (example: 2026-01-01 15:00)',
  );

export const idParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive('ID must be a positive integer'),
  }),
});
