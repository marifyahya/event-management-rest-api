import z from 'zod';

export const registerUserSchema = z.object({
  body: z.object({
    fullname: z.string().min(3, 'Full name must be at least 3 characters'),
    email: z.email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const indexUserSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    name: z.string().trim().optional(),
    email: z.string().trim().optional(),
    role: z.string().trim().optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});
