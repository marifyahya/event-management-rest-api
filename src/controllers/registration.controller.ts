import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { eventService } from '../services/event.service.js';
import { slotRedisService } from '../services/redis-slot.service.js';
import { createOrderQueue } from '../queues/create-order.queue.js';
import { NotFoundError, ConflictError } from '../utils/app-error.js';
import { prisma } from '../db/index.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const eventId = Number(req.params.id);
  if (Number.isNaN(eventId)) {
    throw new NotFoundError('Event not found');
  }

  const event = await eventService.findPublishedById(eventId);
  if (!event) {
    throw new NotFoundError('Event not found');
  }

  if (event.startAt <= new Date()) {
    throw new ConflictError('Event has already started');
  }

  const existing = await prisma.registration.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId: req.user!.id,
      },
    },
  });

  if (existing) {
    throw new ConflictError('You are already registered for this event');
  }

  const { reservationId } = await slotRedisService.reserveSlot(eventId, req.user!.id);

  const job = await createOrderQueue.add('create-order', {
    eventId,
    userId: req.user!.id,
    reservationId,
    slotIds: [],
    quantity: 1,
  });

  res.status(201).json({
    success: true,
    message: 'Registration initiated',
    data: {
      reservationId,
      jobId: job.id,
    },
  });
});
