import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
} from '../controllers/employeeController.js';

const router = express.Router();

router.get('/', authenticate, requireAdmin, getAllEmployees);
router.get('/departments', authenticate, getDepartments);
router.get('/:id', authenticate, requireAdmin, getEmployeeById);
router.post('/', authenticate, requireAdmin, createEmployee);
router.put('/:id', authenticate, requireAdmin, updateEmployee);
router.delete('/:id', authenticate, requireAdmin, deleteEmployee);

export default router;

