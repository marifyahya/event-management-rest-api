import { EVENT_STATUS } from '../constants/event-status.js';
import { ORDER_STATUS } from '../constants/order-status.js';
import { NotFoundError, BadRequest } from '../utils/app-error.js';
import { generateOrderNumber } from '../utils/order-number.js';
import { prisma } from '../db/index.js';
import { logger } from '../libs/logger.js';
import { reserveStock, releaseReservation, RESERVATION_TTL } from '../libs/reservation.js';
import { createPaymentQueue } from '../queues/create-payment.queue.js';
import { orderExpireQueue } from '../queues/order-expire.queue.js';

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
}

export const orderService = new OrderService();
