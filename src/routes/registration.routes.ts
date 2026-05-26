import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParamSchema } from '../validators/common.validator.js';
import { register } from '../controllers/registration.controller.js';

const registrationRoutes = Router();

registrationRoutes.post('/:id/register', authMiddleware, validate(idParamSchema), register);

export default registrationRoutes;
