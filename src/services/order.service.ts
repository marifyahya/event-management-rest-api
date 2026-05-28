import { prisma } from '../db/index.js';
import { ORDER_STATUS } from '../constants/status.js';

class OrderService {
  async updateStatusPaid(orderId: string) {
    return prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: ORDER_STATUS.PAID,
        paidAt: new Date(),
      },
    });
  }
}

export const orderService = new OrderService();
