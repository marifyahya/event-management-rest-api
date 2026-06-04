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
