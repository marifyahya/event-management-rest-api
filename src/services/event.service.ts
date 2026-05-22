import { EVENT_STATUS } from '../constants/event-status.js';
import { prisma } from '../db/index.js';

const toDate = (value: string) => new Date(value.replace(' ', 'T') + ':00');

class EventService {
  store(event: {
    organizerId: number;
    title: string;
    description?: string;
    category?: string;
    location: string;
    startAt: string;
    endAt: string;
    capacity: number;
  }) {
    return prisma.event.create({
      data: {
        organizerId: event.organizerId,
        title: event.title,
        description: event.description,
        category: event.category,
        location: event.location,
        startAt: toDate(event.startAt),
        endAt: toDate(event.endAt),
        status: EVENT_STATUS.DRAFT,
        capacity: event.capacity,
      },
    });
  }
}

export const eventService = new EventService();
