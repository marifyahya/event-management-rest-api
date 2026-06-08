import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { orderEventSchema } from '../validators/event.validator.js';
import * as orderController from '../controllers/order.controller.js';
import { orderRateLimiter } from '../middleware/rate-limiter.middleware.js';

const orderRouter = Router();

orderRouter.post('/', orderRateLimiter, validate(orderEventSchema), orderController.store);
orderRouter.get('/:id', orderController.show);

export default orderRouter;
