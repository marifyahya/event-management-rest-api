import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { NotFoundError } from '../utils/app-error.js';
import { registrationService } from '../services/registration.service.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const eventId = Number(req.params.id);
  if (Number.isNaN(eventId)) {
    throw new NotFoundError('Event not found');
  }

  const userId = req.user?.id;
  if (userId === undefined) {
    throw new NotFoundError('User not found');
  }

  const registration = await registrationService.create({
    userId,
    eventId,
    quantity: req.body.quantity,
  });

  res.status(201).json({
    success: true,
    message: 'Registration initiated',
    data: {
      reservationId: registration.reservationId,
      jobId: registration.jobId,
    },
  });
});
