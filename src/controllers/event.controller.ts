import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { eventService } from '../services/event.service.js';

export const store = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventService.store({ ...req.body, organizerId: req.user!.id });

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: event,
  });
});
