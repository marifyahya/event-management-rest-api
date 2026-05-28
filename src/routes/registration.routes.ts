import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { register } from '../controllers/registration.controller.js';
import { registerEventSchema } from '../validators/event.validator.js';

const registrationRoutes = Router();

registrationRoutes.post('/:id/register', authMiddleware, validate(registerEventSchema), register);

export default registrationRoutes;
