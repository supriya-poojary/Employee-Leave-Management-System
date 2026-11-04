import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getLeaveApplications,
  getLeaveApplicationById,
  createLeaveApplication,
  updateLeaveStatus,
  cancelLeaveApplication,
  getLeaveBalance,
} from '../controllers/leaveController.js';

// Safe upload directory: /tmp/uploads on Vercel/serverless, local uploads/ folder in development
const uploadDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : 'uploads/';
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.warn('Could not create upload directory:', err.message);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only images and PDFs are allowed'));
  },
});

const router = express.Router();

router.get('/', authenticate, getLeaveApplications);
router.get('/balance', authenticate, getLeaveBalance);
router.get('/balance/:userId', authenticate, requireAdmin, getLeaveBalance);
router.get('/:id', authenticate, getLeaveApplicationById);
router.post('/', authenticate, upload.single('document'), createLeaveApplication);
router.patch('/:id/status', authenticate, requireAdmin, updateLeaveStatus);
router.patch('/:id/cancel', authenticate, cancelLeaveApplication);

export default router;
