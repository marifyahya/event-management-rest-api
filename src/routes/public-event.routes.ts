import { Router } from 'express';

import * as eventControlller from '../controllers/event.controller.js';

const publicEventRoutes = Router();

publicEventRoutes.get('/', eventControlller.indexPublished);
publicEventRoutes.get('/:id', eventControlller.showPublished);

export default publicEventRoutes;
