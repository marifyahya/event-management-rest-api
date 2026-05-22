import { EVENT_STATUS, EVENT_STATUS_LABEL } from '../constants/event-status.js';
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

  async getAllEvent(query: {
    page?: number;
    limit?: number;
    title?: string;
    category?: string;
    location?: string;
    status?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.title && {
        title: {
          contains: query.title,
          mode: 'insensitive' as const,
        },
      }),
      ...(query.category && {
        category: {
          contains: query.category,
          mode: 'insensitive' as const,
        },
      }),
      ...(query.location && {
        location: {
          contains: query.location,
          mode: 'insensitive' as const,
        },
      }),
      ...(query.status && { status: query.status }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.event.count({
        where,
      }),
    ]);

    const eventsWithStatusLabel = events.map((event) => ({
      ...event,
      statusLabel: EVENT_STATUS_LABEL[event.status as keyof typeof EVENT_STATUS_LABEL],
    }));

    return {
      data: eventsWithStatusLabel,
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async findById(id: number) {
    const event = await prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (event) {
      const eventWithStatusLabel = {
        ...event,
        statusLabel: EVENT_STATUS_LABEL[event.status as keyof typeof EVENT_STATUS_LABEL],
      };

      return eventWithStatusLabel;
    }

    return event;
  }
}

export const eventService = new EventService();
