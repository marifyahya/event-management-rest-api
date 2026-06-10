import { Router } from 'express';
import * as adminDashboardController from '../controllers/admin-dashboard.controller.js';
import { requireRole } from '../middleware/auth.middleware.js';

const adminDashboardRouter = Router();

adminDashboardRouter.get('/summary', requireRole(['admin']), adminDashboardController.getDashboardSummary);

export default adminDashboardRouter;
