import { query } from '../config/database.js';

export const getAdminDashboard = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [
      totalEmployees,
      totalApplications,
      pendingCount,
      approvedCount,
      rejectedCount,
      onLeaveToday,
      monthlyStats,
      departmentStats,
      recentApplications,
    ] = await Promise.all([
      query("SELECT COUNT(*) as count FROM users WHERE role = 'employee' AND is_active = true"),
      query("SELECT COUNT(*) as count FROM leave_applications WHERE EXTRACT(YEAR FROM created_at) = $1", [currentYear]),
      query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'pending'"),
      query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'approved' AND EXTRACT(YEAR FROM created_at) = $1", [currentYear]),
      query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'rejected' AND EXTRACT(YEAR FROM created_at) = $1", [currentYear]),
      query(`SELECT COUNT(*) as count FROM leave_applications 
             WHERE status = 'approved' AND CURRENT_DATE BETWEEN start_date AND end_date`),
      query(`SELECT 
               TO_CHAR(created_at, 'Mon') as month,
               EXTRACT(MONTH FROM created_at) as month_num,
               COUNT(*) as total,
               COUNT(*) FILTER (WHERE status = 'approved') as approved,
               COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
               COUNT(*) FILTER (WHERE status = 'pending') as pending
             FROM leave_applications 
             WHERE EXTRACT(YEAR FROM created_at) = $1
             GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
             ORDER BY month_num`, [currentYear]),
      query(`SELECT 
               u.department,
               COUNT(*) as total_applications,
               COUNT(*) FILTER (WHERE la.status = 'approved') as approved,
               COUNT(*) FILTER (WHERE la.status = 'pending') as pending
             FROM leave_applications la
             JOIN users u ON la.user_id = u.id
             WHERE EXTRACT(YEAR FROM la.created_at) = $1
             GROUP BY u.department
             ORDER BY total_applications DESC`, [currentYear]),
      query(`SELECT la.*, u.name as employee_name, u.department, u.employee_id as employee_code
             FROM leave_applications la
             JOIN users u ON la.user_id = u.id
             ORDER BY la.created_at DESC
             LIMIT 5`),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEmployees: parseInt(totalEmployees.rows[0].count),
          totalApplications: parseInt(totalApplications.rows[0].count),
          pendingCount: parseInt(pendingCount.rows[0].count),
          approvedCount: parseInt(approvedCount.rows[0].count),
          rejectedCount: parseInt(rejectedCount.rows[0].count),
          onLeaveToday: parseInt(onLeaveToday.rows[0].count),
        },
        monthlyStats: monthlyStats.rows,
        departmentStats: departmentStats.rows,
        recentApplications: recentApplications.rows,
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAdminAnalytics = async (req, res) => {
  try {
    const [
      totalEmployees,
      totalApplications,
      pendingCount,
      approvedCount,
      rejectedCount,
      onLeaveToday,
      monthlyStats,
      departmentStats,
    ] = await Promise.all([
      query("SELECT COUNT(*) as count FROM users WHERE role = 'employee' AND is_active = true"),
      query('SELECT COUNT(*) as count FROM leave_applications'),
      query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'pending'"),
      query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'approved'"),
      query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'rejected'"),
      query(`SELECT COUNT(*) as count FROM leave_applications
             WHERE status = 'approved' AND CURRENT_DATE BETWEEN start_date AND end_date`),
      query(`SELECT
               TO_CHAR(created_at, 'Mon YY') as month,
               EXTRACT(YEAR FROM created_at) * 12 + EXTRACT(MONTH FROM created_at) as month_num,
               COUNT(*) as total,
               COUNT(*) FILTER (WHERE status = 'approved') as approved,
               COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
               COUNT(*) FILTER (WHERE status = 'pending') as pending
             FROM leave_applications
             WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
               AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
             GROUP BY TO_CHAR(created_at, 'Mon YY'), EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
             ORDER BY month_num`),
      query(`SELECT
               u.department,
               COUNT(*) as total_applications,
               COUNT(*) FILTER (WHERE la.status = 'approved') as approved,
               COUNT(*) FILTER (WHERE la.status = 'pending') as pending
             FROM leave_applications la
             JOIN users u ON la.user_id = u.id
             GROUP BY u.department
             ORDER BY total_applications DESC`),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEmployees: parseInt(totalEmployees.rows[0].count),
          totalApplications: parseInt(totalApplications.rows[0].count),
          pendingCount: parseInt(pendingCount.rows[0].count),
          approvedCount: parseInt(approvedCount.rows[0].count),
          rejectedCount: parseInt(rejectedCount.rows[0].count),
          onLeaveToday: parseInt(onLeaveToday.rows[0].count),
        },
        monthlyStats: monthlyStats.rows,
        departmentStats: departmentStats.rows,
      },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    const [balances, applicationStats, recentApplications, upcomingLeaves] = await Promise.all([
      query('SELECT * FROM leave_balances WHERE user_id = $1 AND year = $2 ORDER BY leave_type', [userId, currentYear]),
      query(`SELECT 
               COUNT(*) as total,
               COUNT(*) FILTER (WHERE status = 'pending') as pending,
               COUNT(*) FILTER (WHERE status = 'approved') as approved,
               COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
               COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
             FROM leave_applications WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2`,
        [userId, currentYear]),
      query(`SELECT * FROM leave_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`, [userId]),
      query(`SELECT * FROM leave_applications 
             WHERE user_id = $1 AND status = 'approved' AND start_date >= CURRENT_DATE
             ORDER BY start_date ASC LIMIT 3`, [userId]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        leaveBalances: balances.rows,
        applicationStats: applicationStats.rows[0],
        recentApplications: recentApplications.rows,
        upcomingLeaves: upcomingLeaves.rows,
      },
    });
  } catch (error) {
    console.error('Employee dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

