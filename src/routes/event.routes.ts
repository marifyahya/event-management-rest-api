import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  cancelEventSchema,
  eventListSchema,
  storeEventSchema,
  updateEventSchema,
} from '../validators/event.validator.js';
import * as eventController from '../controllers/event.controller.js';

const eventRouter = Router();

eventRouter.post('/', validate(storeEventSchema), eventController.store);
eventRouter.get('/', validate(eventListSchema), eventController.index);
eventRouter.get('/:id', validate(idParamSchema), eventController.show);
eventRouter.patch('/:id', validate(idParamSchema), validate(updateEventSchema), eventController.update);
eventRouter.delete('/:id', validate(idParamSchema), eventController.destroy);
eventRouter.post('/:id/publish', validate(idParamSchema), eventController.publish);
eventRouter.post('/:id/cancel', validate(idParamSchema), validate(cancelEventSchema), eventController.cancel);
eventRouter.post('/:id/move-to-draft', validate(idParamSchema), eventController.moveToDraft);
eventRouter.post('/:id/archive', validate(idParamSchema), eventController.archive);

export default eventRouter;
