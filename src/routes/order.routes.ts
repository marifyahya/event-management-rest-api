import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { orderEventSchema } from '../validators/event.validator.js';
import * as orderController from '../controllers/order.controller.js';

const orderRouter = Router();

orderRouter.post('/', validate(orderEventSchema), orderController.store);

export default orderRouter;
