import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from '../backend/src/routes/auth.js';
import employeeRoutes from '../backend/src/routes/employees.js';
import leaveRoutes from '../backend/src/routes/leaves.js';
import dashboardRoutes from '../backend/src/routes/dashboard.js';

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Safe upload static route
const uploadStaticPath = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '..', 'backend', 'uploads');
app.use('/uploads', express.static(uploadStaticPath));
app.use('/api/uploads', express.static(uploadStaticPath));

// Health checks
app.get(['/api/health', '/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  });
});

app.get(['/api', '/api/'], (req, res) => {
  res.status(200).json({
    name: 'Employee Leave Management System API',
    status: 'online',
  });
});

// Mount routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Also mount routes directly in case Vercel rewrites strip /api prefix
app.use('/auth', authRoutes);
app.use('/employees', employeeRoutes);
app.use('/leaves', leaveRoutes);
app.use('/dashboard', dashboardRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled serverless error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

export default app;

