import { EVENT_STATUS } from '../constants/event-status.js';
import { ORDER_STATUS } from '../constants/order-status.js';
import { NotFoundError, BadRequest } from '../utils/app-error.js';
import { generateOrderNumber } from '../utils/order-number.js';
import { prisma } from '../db/index.js';
import { logger } from '../libs/logger.js';
import { reserveStock, releaseReservation, RESERVATION_TTL } from '../libs/reservation.js';
import { createPaymentQueue } from '../queues/create-payment.queue.js';
import { orderExpireQueue } from '../queues/order-expire.queue.js';
import { format } from 'fast-csv';
import { Response } from 'express';
import { formatCSVDate } from '../utils/date-formatter.js';
import ExcelJS from 'exceljs';

class OrderService {
  private static readonly DEFAULT_ADMIN_FEE = 2500;

  async createOrder(requestOrder: { userId: number; eventId: number; quantity: number; paymentMethod: string }) {
    const event = await prisma.event.findUnique({
      where: {
        id: requestOrder.eventId,
        status: EVENT_STATUS.PUBLISHED,
        startAt: {
          gt: new Date(),
        },
        capacity: {
          gt: requestOrder.quantity,
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const orderNumber = generateOrderNumber();
    const reservation = await reserveStock(event.id, orderNumber, requestOrder.quantity);

    if (!reservation.success) {
      if (reservation.reason === 'sold_out') {
        throw new BadRequest('Event sold out');
      }

      throw new BadRequest('Event not available');
    }

    const adminFeeTotal = OrderService.DEFAULT_ADMIN_FEE * requestOrder.quantity;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        eventId: requestOrder.eventId,
        userId: requestOrder.userId,
        quantity: requestOrder.quantity,
        subtotalAmount: requestOrder.quantity * event.price,
        adminFee: adminFeeTotal,
        totalAmount: requestOrder.quantity * event.price + adminFeeTotal,
        expiresAt: reservation.expiresAt,
      },
      include: {
        payment: true,
        event: true,
        user: true,
      },
    });

    try {
      await createPaymentQueue.add(`payment-${order.orderNumber}`, {
        orderId: order.id,
        paymentMethod: requestOrder.paymentMethod,
      });

      await orderExpireQueue.add(
        `expire-${order.orderNumber}`,
        { orderId: order.id },
        {
          delay: RESERVATION_TTL * 1000,
          jobId: `expire-${order.id}`,
        },
      );
    } catch (error) {
      logger.error({ err: error, orderId: order.id }, 'Failed to enqueue jobs, rolling back order');

      // Cleanup: cancel the order and release reserved stock safely
      await Promise.allSettled([
        prisma.order.update({
          where: { id: order.id },
          data: { status: ORDER_STATUS.CANCELLED },
        }),
        releaseReservation(event.id, orderNumber),
      ]);

      throw new BadRequest('Failed to process order, please try again');
    }

    return order;
  }

  async getOrderById(orderId: string, userId: number) {
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId,
      },
      include: {
        payment: true,
        event: true,
        user: true,
        tickets: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }

  async getTotalOrder() {
    const [orderGroups, totalTicket, totalRevenue] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.ticket.count(),
      prisma.order.aggregate({
        where: { status: ORDER_STATUS.PAID },
        _sum: { totalAmount: true },
      }),
    ]);

    let totalPaid = 0;
    let totalPending = 0;
    let totalExpired = 0;
    let totalOrder = 0;

    orderGroups.forEach((group) => {
      const count = group._count._all;
      totalOrder += count;
      if (group.status === ORDER_STATUS.PAID) totalPaid = count;
      if (group.status === ORDER_STATUS.PENDING) totalPending = count;
      if (group.status === ORDER_STATUS.EXPIRED) totalExpired = count;
    });

    return {
      totalOrder,
      totalPaid,
      totalPending,
      totalExpired,
      totalTicket,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
  }

  async getAllOrders(filters: any, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: filters,
        skip,
        take: limit,
        include: {
          event: { select: { title: true } },
          user: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: filters }),
    ]);

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportCSV(filters: any, res: Response, timezone?: string) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
    res.setHeader('Transfer-Encoding', 'chunked');

    const csvStream = format({ headers: true });
    csvStream.pipe(res);

    let cursorId: string | undefined = undefined;
    const BATCH_SIZE = 5000;

    while (true) {
      const orders: any[] = await prisma.order.findMany({
        take: BATCH_SIZE,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { id: cursorId } : undefined,
        where: filters,
        include: {
          event: { select: { title: true } },
          user: { select: { fullName: true, email: true } },
        },
        orderBy: { id: 'asc' },
      });

      if (orders.length === 0) {
        break;
      }

      for (const order of orders) {
        csvStream.write({
          'Order Number': order.orderNumber,
          'Event Name': order.event?.title || '-',
          'Buyer Name': order.user?.fullName || '-',
          'Buyer Email': order.user?.email || '-',
          Quantity: order.quantity,
          Subtotal: order.subtotalAmount,
          'Admin Fee': order.adminFee,
          'Total Amount': order.totalAmount,
          Status: order.status,
          'Payment Method': order.payment?.method || '-',
          'Transaction Date': formatCSVDate(order.createdAt, timezone),
        });
      }

      cursorId = orders[orders.length - 1].id;
    }

    csvStream.end();
  }

  async exportXLSX(filters: any, res: Response, timezone?: string) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="orders-export.xlsx"');
    res.setHeader('Transfer-Encoding', 'chunked');

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res as any,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
      { header: 'Order Number', key: 'orderNumber', width: 25 },
      { header: 'Event Name', key: 'eventName', width: 30 },
      { header: 'Buyer Name', key: 'buyerName', width: 25 },
      { header: 'Buyer Email', key: 'buyerEmail', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Subtotal', key: 'subtotal', width: 15 },
      { header: 'Admin Fee', key: 'adminFee', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 20 },
      { header: 'Transaction Date', key: 'transactionDate', width: 25 },
    ];

    let cursorId: string | undefined = undefined;
    const BATCH_SIZE = 5000;

    while (true) {
      const orders: any[] = await prisma.order.findMany({
        take: BATCH_SIZE,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { id: cursorId } : undefined,
        where: filters,
        include: {
          event: { select: { title: true } },
          user: { select: { fullName: true, email: true } },
        },
        orderBy: { id: 'asc' },
      });

      if (orders.length === 0) {
        break;
      }

      for (const order of orders) {
        worksheet
          .addRow({
            orderNumber: order.orderNumber,
            eventName: order.event?.title || '-',
            buyerName: order.user?.fullName || '-',
            buyerEmail: order.user?.email || '-',
            quantity: order.quantity,
            subtotal: order.subtotalAmount,
            adminFee: order.adminFee,
            totalAmount: order.totalAmount,
            status: order.status,
            paymentMethod: order.payment?.method || '-',
            transactionDate: formatCSVDate(order.createdAt, timezone),
          })
          .commit();
      }

      cursorId = orders[orders.length - 1].id;
    }

    await workbook.commit();
  }
}
export const orderService = new OrderService();
