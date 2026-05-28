import { EVENT_STATUS, EVENT_STATUS_LABEL } from '../constants/event-status.js';
import { prisma } from '../db/index.js';
import { logger } from '../libs/logger.js';
import { NotFoundError, ValidationError } from '../utils/app-error.js';
import { slotRedisService } from './redis-slot.service.js';

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
    price: number;
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
        price: event.price,
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

  async update(
    id: number,
    data: Partial<{
      title: string;
      description?: string;
      category?: string;
      location: string;
      capacity: number;
      price: number;
      startAt: string;
      endAt: string;
    }>,
  ) {
    const event = await prisma.event.update({
      where: {
        id,
      },
      data: {
        ...data,
        ...(data.startAt && { startAt: toDate(data.startAt) }),
        ...(data.endAt && { endAt: toDate(data.endAt) }),
        updatedAt: new Date(),
      },
    });

    return event;
  }

  async delete(id: number) {
    const event = await this.getEventOrThrow(id);

    if (event.status !== EVENT_STATUS.ARCHIVED) {
      throw new ValidationError('Only events with archived status can be deleted');
    }

    return prisma.event.update({
      where: {
        id,
      },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }

  async publish(id: number) {
    const event = await this.getEventOrThrow(id);

    if (event.status !== EVENT_STATUS.DRAFT) {
      throw new ValidationError('Only events with draft status can be published');
    }

    return prisma.event.update({
      where: {
        id,
      },
      data: {
        status: EVENT_STATUS.PUBLISHED,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async cancel(event: { id: number; cancelReason: string }) {
    const findEvent = await this.getEventOrThrow(event.id);

    if (!findEvent) {
      throw new NotFoundError('Event not found');
    }

    if (findEvent.status !== EVENT_STATUS.PUBLISHED) {
      throw new ValidationError('Only events with published status can be cancelled');
    }

    return prisma.event.update({
      where: {
        id: event.id,
      },
      data: {
        status: EVENT_STATUS.CANCELLED,
        cancelReason: event.cancelReason,
        publishedAt: null,
        updatedAt: new Date(),
      },
    });
  }

  async archive(id: number) {
    await this.getEventOrThrow(id);

    return prisma.event.update({
      where: {
        id,
      },
      data: {
        status: EVENT_STATUS.ARCHIVED,
        updatedAt: new Date(),
      },
    });
  }

  async moveToDraft(id: number) {
    const event = await this.getEventOrThrow(id);

    if (event.status !== EVENT_STATUS.CANCELLED) {
      throw new ValidationError('Only events with cancelled status can be moved to draft');
    }

    return prisma.event.update({
      where: {
        id,
      },
      data: {
        status: EVENT_STATUS.DRAFT,
        updatedAt: new Date(),
      },
    });
  }

  private async getEventOrThrow(id: number) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundError('Event not found');
    return event;
  }

  async getAllPublishedEvent(query: {
    page?: number;
    limit?: number;
    title?: string;
    category?: string;
    location?: string;
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
      status: EVENT_STATUS.PUBLISHED,
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

  async findPublishedById(id: number) {
    const event = await prisma.event.findFirst({
      where: {
        id,
        status: EVENT_STATUS.PUBLISHED,
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

  async seedSlotCounters() {
    try {
      const events = await prisma.event.findMany({
        where: { status: EVENT_STATUS.PUBLISHED },
        select: { id: true, capacity: true },
      });

      for (const event of events) {
        const usedCount = await prisma.order.aggregate({
          where: { eventId: event.id },
          _sum: { quantity: true },
        });
        await slotRedisService.seedSlot(event.id, event.capacity, usedCount._sum.quantity || 0);
      }

      logger.info(`Seeded ${events.length} event slot counters`);
    } catch (err) {
      logger.error({ err }, 'Failed to seed slot counters');
    }
  }
}

export const eventService = new EventService();
