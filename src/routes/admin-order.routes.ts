import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { adminOrderListSchema } from '../validators/order.validator.js';
import * as orderController from '../controllers/order.controller.js';
import { roleAdminMiddleware } from '../middleware/role-admin.middleware.js';

const adminOrderRouter = Router();

adminOrderRouter.use(roleAdminMiddleware);
adminOrderRouter.get('/', validate(adminOrderListSchema), orderController.index);

export default adminOrderRouter;
