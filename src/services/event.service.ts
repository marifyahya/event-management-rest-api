import { EVENT_STATUS, EVENT_STATUS_LABEL } from '../constants/event-status.js';
import { ORDER_STATUS } from '../constants/order-status.js';
import { prisma } from '../db/index.js';
import { initEventStock } from '../libs/reservation.js';
import { NotFoundError, ValidationError } from '../utils/app-error.js';
import { format } from 'fast-csv';
import { Response } from 'express';
import { formatCSVDate } from '../utils/date-formatter.js';
import ExcelJS from 'exceljs';

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
    sortBy?: string;
    sort?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt';
    const sort = query.sort || 'desc';

    const allowedSortBy = [
      'id',
      'title',
      'category',
      'location',
      'startAt',
      'endAt',
      'price',
      'capacity',
      'status',
      'createdAt',
      'updatedAt',
    ];
    const validSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'createdAt';
    const validSort = sort === 'asc' ? 'asc' : 'desc';

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
          [validSortBy]: validSort,
        },
        include: {
          organizer: {
            select: {
              fullName: true,
            },
          },
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
      include: {
        organizer: {
          select: {
            id: true,
            fullName: true,
          },
        },
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

    await initEventStock(id, event.capacity, false);

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

  getTotalEvent() {
    return prisma.event.count({
      where: {
        status: EVENT_STATUS.PUBLISHED,
      },
    });
  }

  getTotalActiveEvent() {
    return prisma.event.count({
      where: {
        status: EVENT_STATUS.PUBLISHED,
        startAt: {
          gte: new Date(),
        },
        endAt: {
          gte: new Date(),
        },
      },
    });
  }

  async getStats(id: number) {
    const event = await this.getEventOrThrow(id);

    const [orderGroups, ticketCount, checkInCount, revenue] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        where: { eventId: id },
        _count: { _all: true },
      }),
      prisma.ticket.count({ where: { eventId: id } }),
      prisma.ticket.count({ where: { eventId: id, usedAt: { not: null } } }),
      prisma.order.aggregate({
        where: { eventId: id, status: ORDER_STATUS.PAID },
        _sum: { totalAmount: true },
      }),
    ]);

    let paid = 0,
      pending = 0,
      expired = 0,
      cancelled = 0,
      totalOrders = 0;

    orderGroups.forEach((group) => {
      const count = group._count._all;
      totalOrders += count;
      if (group.status === ORDER_STATUS.PAID) paid = count;
      if (group.status === ORDER_STATUS.PENDING) pending = count;
      if (group.status === ORDER_STATUS.EXPIRED) expired = count;
      if (group.status === ORDER_STATUS.CANCELLED) cancelled = count;
    });

    const totalRevenue = revenue._sum.totalAmount || 0;
    const attendanceRate = ticketCount > 0 ? Number(((checkInCount / ticketCount) * 100).toFixed(2)) : 0;

    return {
      financial: {
        totalRevenue,
      },
      ticketing: {
        capacity: event.capacity,
        totalTicketsSold: ticketCount,
        remainingCapacity: event.capacity - ticketCount,
      },
      attendance: {
        totalCheckIns: checkInCount,
        attendanceRate,
      },
      orders: {
        paid,
        pending,
        expired,
        cancelled,
        total: totalOrders,
      },
    };
  }

  async exportCSV(filters: any, res: Response, timezone?: string) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="events-export.csv"');
    res.setHeader('Transfer-Encoding', 'chunked');

    const csvStream = format({ headers: true });
    csvStream.pipe(res);

    let cursorId: number | undefined = undefined;
    const BATCH_SIZE = 5000;

    while (true) {
      const events: any[] = await prisma.event.findMany({
        take: BATCH_SIZE,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { id: cursorId } : undefined,
        where: filters,
        orderBy: { id: 'asc' },
      });

      if (events.length === 0) {
        break;
      }

      for (const event of events) {
        csvStream.write({
          'Event ID': event.id,
          Title: event.title,
          Category: event.category || '-',
          Location: event.location,
          Capacity: event.capacity,
          Price: event.price,
          Status: EVENT_STATUS_LABEL[event.status as keyof typeof EVENT_STATUS_LABEL] || event.status,
          'Start Date': formatCSVDate(event.startAt, timezone),
          'End Date': formatCSVDate(event.endAt, timezone),
          'Created At': formatCSVDate(event.createdAt, timezone),
        });
      }

      cursorId = events[events.length - 1].id;
    }

    csvStream.end();
  }

  async exportXLSX(filters: any, res: Response, timezone?: string) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="events-export.xlsx"');
    res.setHeader('Transfer-Encoding', 'chunked');

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res as any,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet('Events');

    worksheet.columns = [
      { header: 'Event ID', key: 'id', width: 10 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Location', key: 'location', width: 25 },
      { header: 'Capacity', key: 'capacity', width: 10 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Start Date', key: 'startDate', width: 25 },
      { header: 'End Date', key: 'endDate', width: 25 },
      { header: 'Created At', key: 'createdAt', width: 25 },
    ];

    let cursorId: number | undefined = undefined;
    const BATCH_SIZE = 5000;

    while (true) {
      const events: any[] = await prisma.event.findMany({
        take: BATCH_SIZE,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { id: cursorId } : undefined,
        where: filters,
        orderBy: { id: 'asc' },
      });

      if (events.length === 0) {
        break;
      }

      for (const event of events) {
        worksheet
          .addRow({
            id: event.id,
            title: event.title,
            category: event.category || '-',
            location: event.location,
            capacity: event.capacity,
            price: event.price,
            status: EVENT_STATUS_LABEL[event.status as keyof typeof EVENT_STATUS_LABEL] || event.status,
            startDate: formatCSVDate(event.startAt, timezone),
            endDate: formatCSVDate(event.endAt, timezone),
            createdAt: formatCSVDate(event.createdAt, timezone),
          })
          .commit();
      }

      cursorId = events[events.length - 1].id;
    }

    await workbook.commit();
  }
}
export const eventService = new EventService();
