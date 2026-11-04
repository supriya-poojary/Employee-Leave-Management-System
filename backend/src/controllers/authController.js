import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getClient } from '../config/database.js';

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const register = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const {
      name,
      email,
      password,
      role = 'employee',
      employee_id,
      department = 'General',
      designation = 'Staff',
      phone,
    } = req.body;

    if (!name || !email || !password) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userRole = role === 'admin' ? 'admin' : 'employee';

    // Auto-generate employee_id if not provided
    const finalEmpId =
      employee_id?.trim() ||
      (userRole === 'admin'
        ? `ADM-${Math.floor(100 + Math.random() * 900)}`
        : `EMP-${Math.floor(1000 + Math.random() * 9000)}`);

    // Check if email or employee_id exists
    const existing = await client.query(
      'SELECT id, email, employee_id FROM users WHERE email = $1 OR employee_id = $2',
      [cleanEmail, finalEmpId]
    );

    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      const conflictMsg =
        existing.rows[0].email === cleanEmail
          ? 'An account with this email already exists'
          : 'Employee ID already in use';
      return res.status(409).json({ success: false, message: conflictMsg });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role, employee_id, department, designation, phone, joining_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, name, email, role, employee_id, department, designation, phone, created_at`,
      [name.trim(), cleanEmail, hashedPassword, userRole, finalEmpId, department.trim(), designation.trim(), phone || null]
    );

    const newUser = userResult.rows[0];
    const currentYear = new Date().getFullYear();

    // If employee, initialize standard annual leave balances
    if (userRole === 'employee') {
      const leaveTypes = [
        { type: 'casual', allocated: 12 },
        { type: 'sick', allocated: 12 },
        { type: 'earned', allocated: 15 },
        { type: 'unpaid', allocated: 0 },
      ];

      for (const lt of leaveTypes) {
        await client.query(
          `INSERT INTO leave_balances (user_id, leave_type, allocated, used, pending, available, year)
           VALUES ($1, $2, $3, 0, 0, $3, $4)
           ON CONFLICT (user_id, leave_type, year) DO NOTHING`,
          [newUser.id, lt.type, lt.allocated, currentYear]
        );
      }
    }

    await client.query('COMMIT');

    const token = generateToken(newUser.id, newUser.role);

    return res.status(201).json({
      success: true,
      message: `${userRole === 'admin' ? 'Administrator' : 'Employee'} account registered successfully`,
      data: {
        token,
        user: newUser,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during registration' });
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user.id, user.role);

    const { password_hash, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.employee_id, u.department, 
              u.designation, u.joining_date, u.phone, u.address, u.avatar_url,
              u.created_at, u.last_login
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      hashedPassword,
      req.user.id,
    ]);

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
