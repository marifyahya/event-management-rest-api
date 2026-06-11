import { orderService } from '../services/order.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const store = asyncHandler(async (req, res) => {
  const { eventId, quantity, paymentMethod } = req.body;
  const userId = Number(req.user?.id);

  const order = await orderService.createOrder({
    eventId: Number(eventId),
    quantity: Number(quantity),
    paymentMethod,
    userId,
  });

  res.status(201).json({
    success: true,
    message: 'Event purchased successfully',
    data: order,
  });
});

export const show = asyncHandler(async (req, res) => {
  const orderId = String(req.params.id);
  const userId = Number(req.user?.id);

  const order = await orderService.getOrderById(orderId, userId);

  res.status(200).json({
    success: true,
    message: 'Order found successfully',
    data: order,
  });
});

export const index = asyncHandler(async (req, res) => {
  const { eventId, status, page = '1', limit = '10', export: exportFormat, timezone } = req.query;

  const filters: any = {};
  if (eventId) filters.eventId = Number(eventId);
  if (status) filters.status = status;

  if (exportFormat === 'csv') {
    return await orderService.exportCSV(filters, res, timezone as string);
  } else if (exportFormat === 'xlsx') {
    return await orderService.exportXLSX(filters, res, timezone as string);
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;

  const result = await orderService.getAllOrders(filters, pageNum, limitNum);

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: result.orders,
    meta: result.meta,
  });
});
