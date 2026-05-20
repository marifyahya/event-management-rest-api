import z from 'zod';

export const registerUserSchema = z.object({
  body: z.object({
    fullname: z.string().min(3, 'Full name must be at least 3 characters'),
    email: z.email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});
