import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { eventListSchema } from '../validators/event.validator.js';

import * as eventController from '../controllers/event.controller.js';

const publicEventRoute = Router();

publicEventRoute.get('/', validate(eventListSchema), eventController.publicEventList);

export default publicEventRoute;
