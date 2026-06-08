import { Router } from 'express';
import { processCheckIn } from '../controllers/checkin.controller.js';
import { requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const checkInSchema = z.object({
  body: z.object({
    qrToken: z.string().min(1, 'QR token is required'),
  }),
});

router.post('/', requireRole(['admin', 'organizer', 'staff']), validate(checkInSchema), processCheckIn);

export default router;
