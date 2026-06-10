import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { orderService } from '../services/order.service.js';
import { eventService } from '../services/event.service.js';

export const getDashboardSummary = asyncHandler(async (_req: Request, res: Response) => {
  const [
    { totalOrder, totalPaid, totalPending, totalExpired, totalTicket, totalRevenue },
    totalActiveEvents,
    totalEvents,
  ] = await Promise.all([
    orderService.getTotalOrder(),
    eventService.getTotalActiveEvent(),
    eventService.getTotalEvent(),
  ]);

  res.status(200).json({
    status: 'success',
    message: 'Dashboard data fetched successfully',
    data: {
      totalRevenue,
      totalOrder,
      totalTicket,
      totalActiveEvents,
      totalEvents,
      totalOrderPaid: totalPaid,
      totalOrderPending: totalPending,
      totalOrderExpired: totalExpired,
    },
  });
});
