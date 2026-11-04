import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getAdminDashboard, getEmployeeDashboard } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/admin', authenticate, requireAdmin, getAdminDashboard);
router.get('/employee', authenticate, getEmployeeDashboard);

export default router;

