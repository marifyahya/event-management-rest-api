import { prisma } from '../db/index.js';
import { ConflictError, NotFoundError } from '../utils/app-error.js';
import { eventService } from './event.service.js';
import { slotRedisService } from './redis-slot.service.js';
import { createOrderQueue } from '../queues/create-order.queue.js';

class RegistrationService {
  async create(registration: { eventId: number; userId: number; quantity: number }) {
    const event = await eventService.findPublishedById(registration.eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.startAt <= new Date()) {
      throw new ConflictError('Event has already started');
    }

    const existing = await prisma.registration.findUnique({
      where: {
        eventId_userId: {
          eventId: registration.eventId,
          userId: registration.userId,
        },
      },
    });

    if (existing) {
      throw new ConflictError('You are already registered for this event');
    }

    const { reservationId } = await slotRedisService.reserveSlot(
      registration.eventId,
      registration.userId,
      registration.quantity,
    );

    const job = await createOrderQueue.add('create-order', {
      eventId: registration.eventId,
      userId: registration.userId,
      reservationId,
      quantity: registration.quantity,
    });

    return {
      reservationId: reservationId,
      jobId: job.id,
    };
  }
}

export const registrationService = new RegistrationService();
