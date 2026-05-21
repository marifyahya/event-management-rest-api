import z from 'zod';

export const registerUserSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(3, 'Full name must be at least 3 characters')
      .max(50, 'Full name must be at most 50 characters'),
    email: z.email('Invalid email format').max(100, 'Email must be at most 100 characters'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(16, 'Password must be at most 16 characters'),
  }),
});

export const loginUserSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format').max(100, 'Email must be at most 100 characters'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(16, 'Password must be at most 16 characters'),
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

export const storeUserSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(3, 'Full name must be at least 3 characters')
      .max(50, 'Full name must be at most 50 characters'),
    email: z.email('Invalid email format').max(100, 'Email must be at most 100 characters'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(16, 'Password must be at most 16 characters'),
    role: z.enum(['admin', 'staff'], 'Role must be either admin or staff').optional(),
    isActive: z.boolean().optional(),
  }),
});
