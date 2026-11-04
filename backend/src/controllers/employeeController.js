import bcrypt from 'bcryptjs';
import { query, getClient } from '../config/database.js';

export const getAllEmployees = async (req, res) => {
  try {
    const { department, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE u.role = 'employee'";
    const params = [];
    let paramCount = 0;

    if (department) {
      paramCount++;
      whereClause += ` AND u.department = $${paramCount}`;
      params.push(department);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.employee_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const countResult = await query(`SELECT COUNT(*) FROM users u ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT u.id, u.name, u.email, u.employee_id, u.department, u.designation, 
              u.joining_date, u.phone, u.is_active, u.created_at,
              COALESCE(
                json_agg(json_build_object(
                  'leave_type', lb.leave_type,
                  'allocated', lb.allocated,
                  'used', lb.used,
                  'pending', lb.pending,
                  'available', lb.available
                )) FILTER (WHERE lb.id IS NOT NULL), '[]'
              ) as leave_balances
       FROM users u
       LEFT JOIN leave_balances lb ON u.id = lb.user_id AND lb.year = EXTRACT(YEAR FROM NOW())
       ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get employees error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT u.id, u.name, u.email, u.employee_id, u.department, u.designation, 
              u.joining_date, u.phone, u.address, u.is_active, u.created_at,
              COALESCE(
                json_agg(json_build_object(
                  'leave_type', lb.leave_type,
                  'allocated', lb.allocated,
                  'used', lb.used,
                  'pending', lb.pending,
                  'available', lb.available
                )) FILTER (WHERE lb.id IS NOT NULL), '[]'
              ) as leave_balances
       FROM users u
       LEFT JOIN leave_balances lb ON u.id = lb.user_id AND lb.year = EXTRACT(YEAR FROM NOW())
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get employee error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createEmployee = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { name, email, password, employee_id, department, designation, joining_date, phone, address } = req.body;

    if (!name || !email || !password || !employee_id || !department || !designation) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    // Check unique
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1 OR employee_id = $2',
      [email.toLowerCase(), employee_id]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Email or Employee ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role, employee_id, department, designation, joining_date, phone, address)
       VALUES ($1, $2, $3, 'employee', $4, $5, $6, $7, $8, $9)
       RETURNING id, name, email, employee_id, department, designation, joining_date, phone, is_active, created_at`,
      [name, email.toLowerCase(), hashedPassword, employee_id, department, designation, joining_date || new Date(), phone, address]
    );

    const newUser = userResult.rows[0];
    const currentYear = new Date().getFullYear();

    // Create default leave balances
    const leaveTypes = [
      { type: 'casual', allocated: 12 },
      { type: 'sick', allocated: 12 },
      { type: 'earned', allocated: 15 },
      { type: 'unpaid', allocated: 0 },
    ];

    for (const lt of leaveTypes) {
      await client.query(
        `INSERT INTO leave_balances (user_id, leave_type, allocated, used, pending, available, year)
         VALUES ($1, $2, $3, 0, 0, $3, $4)`,
        [newUser.id, lt.type, lt.allocated, currentYear]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({ success: true, message: 'Employee created successfully', data: newUser });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create employee error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, designation, phone, address, joining_date, is_active } = req.body;

    const result = await query(
      `UPDATE users SET 
        name = COALESCE($1, name),
        department = COALESCE($2, department),
        designation = COALESCE($3, designation),
        phone = COALESCE($4, phone),
        address = COALESCE($5, address),
        joining_date = COALESCE($6, joining_date),
        is_active = COALESCE($7, is_active),
        updated_at = NOW()
       WHERE id = $8 AND role = 'employee'
       RETURNING id, name, email, employee_id, department, designation, joining_date, phone, is_active`,
      [name, department, designation, phone, address, joining_date, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    return res.status(200).json({ success: true, message: 'Employee updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update employee error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete
    const result = await query(
      `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 AND role = 'employee'
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    return res.status(200).json({ success: true, message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const result = await query(
      "SELECT DISTINCT department FROM users WHERE role = 'employee' AND is_active = true ORDER BY department"
    );
    return res.status(200).json({ success: true, data: result.rows.map(r => r.department) });
  } catch (error) {
    console.error('Get departments error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

