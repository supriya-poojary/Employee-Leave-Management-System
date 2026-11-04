import { query, getClient } from '../config/database.js';
import { differenceInBusinessDays, parseISO, isWeekend, eachDayOfInterval } from 'date-fns';

const calculateBusinessDays = (startDate, endDate) => {
  const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
  return days.filter(day => !isWeekend(day)).length;
};

export const getLeaveApplications = async (req, res) => {
  try {
    const { status, leave_type, department, employee_id, start_date, end_date, page = 1, limit = 10 } = req.query;
    const isAdmin = req.user.role === 'admin';

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Employees can only see their own applications
    if (!isAdmin) {
      paramCount++;
      whereClause += ` AND la.user_id = $${paramCount}`;
      params.push(req.user.id);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND la.status = $${paramCount}`;
      params.push(status);
    }

    if (leave_type) {
      paramCount++;
      whereClause += ` AND la.leave_type = $${paramCount}`;
      params.push(leave_type);
    }

    if (department && isAdmin) {
      paramCount++;
      whereClause += ` AND u.department = $${paramCount}`;
      params.push(department);
    }

    if (employee_id && isAdmin) {
      paramCount++;
      whereClause += ` AND la.user_id = $${paramCount}`;
      params.push(employee_id);
    }

    if (start_date) {
      paramCount++;
      whereClause += ` AND la.start_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      whereClause += ` AND la.end_date <= $${paramCount}`;
      params.push(end_date);
    }

    const offset = (page - 1) * limit;
    const countResult = await query(
      `SELECT COUNT(*) FROM leave_applications la JOIN users u ON la.user_id = u.id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT la.*, 
              u.name as employee_name, u.email as employee_email, 
              u.employee_id as employee_code, u.department, u.designation,
              a.name as approved_by_name
       FROM leave_applications la
       JOIN users u ON la.user_id = u.id
       LEFT JOIN users a ON la.approved_by = a.id
       ${whereClause}
       ORDER BY la.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get leave applications error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getLeaveApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    let whereClause = 'WHERE la.id = $1';
    const params = [id];

    if (!isAdmin) {
      whereClause += ' AND la.user_id = $2';
      params.push(req.user.id);
    }

    const result = await query(
      `SELECT la.*, 
              u.name as employee_name, u.email as employee_email, 
              u.employee_id as employee_code, u.department, u.designation,
              a.name as approved_by_name
       FROM leave_applications la
       JOIN users u ON la.user_id = u.id
       LEFT JOIN users a ON la.approved_by = a.id
       ${whereClause}`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave application not found' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get leave application error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createLeaveApplication = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { leave_type, start_date, end_date, reason } = req.body;
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    if (!leave_type || !start_date || !end_date || !reason) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const validLeaveTypes = ['casual', 'sick', 'earned', 'unpaid'];
    if (!validLeaveTypes.includes(leave_type)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid leave type' });
    }

    const start = parseISO(start_date);
    const end = parseISO(end_date);

    if (start > end) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Start date must be before end date' });
    }

    if (start < new Date(new Date().setHours(0, 0, 0, 0))) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Cannot apply for past dates' });
    }

    // Check for overlapping applications
    const overlapCheck = await client.query(
      `SELECT id FROM leave_applications 
       WHERE user_id = $1 
       AND status IN ('pending', 'approved')
       AND (start_date <= $2 AND end_date >= $3)`,
      [userId, end_date, start_date]
    );

    if (overlapCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'You already have a leave application for overlapping dates' });
    }

    const duration = calculateBusinessDays(start_date, end_date);

    if (duration === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'No working days in selected date range' });
    }

    // Check balance for paid leave
    if (leave_type !== 'unpaid') {
      const balanceResult = await client.query(
        'SELECT available FROM leave_balances WHERE user_id = $1 AND leave_type = $2 AND year = $3',
        [userId, leave_type, currentYear]
      );

      if (balanceResult.rows.length === 0 || balanceResult.rows[0].available < duration) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leave_type} leave balance. Available: ${balanceResult.rows[0]?.available || 0} days`,
        });
      }
    }

    // Generate application ID
    const appIdResult = await client.query(
      "SELECT 'LV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('leave_application_seq')::TEXT, 4, '0') as app_id"
    );
    const applicationId = appIdResult.rows[0].app_id;

    const document_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await client.query(
      `INSERT INTO leave_applications 
        (application_id, user_id, leave_type, start_date, end_date, duration, reason, status, document_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
       RETURNING *`,
      [applicationId, userId, leave_type, start_date, end_date, duration, reason, document_url]
    );

    // Update pending count in leave_balances
    if (leave_type !== 'unpaid') {
      await client.query(
        `UPDATE leave_balances 
         SET pending = pending + $1, available = available - $1, updated_at = NOW()
         WHERE user_id = $2 AND leave_type = $3 AND year = $4`,
        [duration, userId, leave_type, currentYear]
      );
    } else {
      // For unpaid, just track in a separate row (allocated = 0)
      const unpaidBalance = await client.query(
        'SELECT id FROM leave_balances WHERE user_id = $1 AND leave_type = $2 AND year = $3',
        [userId, 'unpaid', currentYear]
      );
      if (unpaidBalance.rows.length > 0) {
        await client.query(
          `UPDATE leave_balances SET pending = pending + $1, updated_at = NOW()
           WHERE user_id = $2 AND leave_type = $3 AND year = $4`,
          [duration, userId, 'unpaid', currentYear]
        );
      }
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create leave application error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const updateLeaveStatus = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status, remarks } = req.body;
    const adminId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid status. Must be approved or rejected' });
    }

    const appResult = await client.query(
      'SELECT * FROM leave_applications WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (appResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Leave application not found' });
    }

    const application = appResult.rows[0];

    if (application.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: `Application is already ${application.status}. Cannot change status again.`,
      });
    }

    const currentYear = new Date(application.start_date).getFullYear();

    // Update application status
    const updatedApp = await client.query(
      `UPDATE leave_applications 
       SET status = $1, remarks = $2, approved_by = $3, approved_at = NOW(), updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, remarks, adminId, id]
    );

    // Update leave balances
    if (application.leave_type !== 'unpaid') {
      if (status === 'approved') {
        // Move from pending to used
        await client.query(
          `UPDATE leave_balances 
           SET pending = pending - $1, used = used + $1, updated_at = NOW()
           WHERE user_id = $2 AND leave_type = $3 AND year = $4`,
          [application.duration, application.user_id, application.leave_type, currentYear]
        );
      } else if (status === 'rejected') {
        // Restore available balance
        await client.query(
          `UPDATE leave_balances 
           SET pending = pending - $1, available = available + $1, updated_at = NOW()
           WHERE user_id = $2 AND leave_type = $3 AND year = $4`,
          [application.duration, application.user_id, application.leave_type, currentYear]
        );
      }
    } else {
      if (status === 'approved') {
        await client.query(
          `UPDATE leave_balances 
           SET pending = pending - $1, used = used + $1, updated_at = NOW()
           WHERE user_id = $2 AND leave_type = $3 AND year = $4`,
          [application.duration, application.user_id, 'unpaid', currentYear]
        );
      } else {
        await client.query(
          `UPDATE leave_balances 
           SET pending = GREATEST(0, pending - $1), updated_at = NOW()
           WHERE user_id = $2 AND leave_type = $3 AND year = $4`,
          [application.duration, application.user_id, 'unpaid', currentYear]
        );
      }
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Leave application ${status} successfully`,
      data: updatedApp.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update leave status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const cancelLeaveApplication = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const userId = req.user.id;

    const appResult = await client.query(
      'SELECT * FROM leave_applications WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [id, userId]
    );

    if (appResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Leave application not found' });
    }

    const application = appResult.rows[0];

    if (application.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Application already cancelled' });
    }

    if (application.status === 'approved') {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Cannot cancel an approved application. Contact admin.' });
    }

    const currentYear = new Date(application.start_date).getFullYear();

    await client.query(
      `UPDATE leave_applications SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // Restore balance for pending applications
    if (application.status === 'pending' && application.leave_type !== 'unpaid') {
      await client.query(
        `UPDATE leave_balances 
         SET pending = pending - $1, available = available + $1, updated_at = NOW()
         WHERE user_id = $2 AND leave_type = $3 AND year = $4`,
        [application.duration, userId, application.leave_type, currentYear]
      );
    }

    await client.query('COMMIT');

    return res.status(200).json({ success: true, message: 'Leave application cancelled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel leave error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const getLeaveBalance = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const year = req.query.year || new Date().getFullYear();

    // Admin can view any employee's balance; employees can only view their own
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await query(
      'SELECT * FROM leave_balances WHERE user_id = $1 AND year = $2 ORDER BY leave_type',
      [userId, year]
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get leave balance error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

