import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { roleAdminMiddleware } from '../middleware/role-admin.middleware.js';
import { idParamSchema } from '../validators/common.validator.js';
import { indexUserSchema, storeUserSchema, updateUserSchema } from '../validators/user.validator.js';
import * as userController from '../controllers/user.controller.js';

const userRouter = Router();

userRouter.use(roleAdminMiddleware);
userRouter.get('/', validate(indexUserSchema), userController.index);
userRouter.get('/:id', validate(idParamSchema), userController.show);
userRouter.post('/', validate(storeUserSchema), userController.store);
userRouter.patch('/:id', validate(idParamSchema), validate(updateUserSchema), userController.update);
userRouter.delete('/:id', validate(idParamSchema), userController.destroy);

export default userRouter;
