import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('\n❌ ERROR: DATABASE_URL is not set in backend/.env');
  console.error('Please configure your Supabase PostgreSQL connection string in backend/.env before running seed.\n');
  process.exit(1);
}

const { Pool } = pg;
const isSupabaseUrl = process.env.DATABASE_URL?.includes('supabase.co');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isSupabaseUrl || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🌱 Starting database seed...');

    // Create Admin Account
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminHash = await bcrypt.hash(adminPassword, 12);

    await client.query(
      `INSERT INTO users (name, email, password_hash, role, employee_id, department, designation, joining_date)
       VALUES ($1, $2, $3, 'admin', $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [
        'System Admin',
        process.env.ADMIN_EMAIL || 'admin@company.com',
        adminHash,
        'ADM-001',
        'Administration',
        'System Administrator',
        new Date(),
      ]
    );

    console.log('✅ Admin account created/updated');

    // Create Sample Employees
    const employees = [
      { name: 'Arjun Sharma', email: 'arjun.sharma@company.com', emp_id: 'EMP-001', dept: 'Engineering', desig: 'Software Engineer', joining: '2023-03-15' },
      { name: 'Priya Patel', email: 'priya.patel@company.com', emp_id: 'EMP-002', dept: 'Human Resources', desig: 'HR Manager', joining: '2022-07-01' },
      { name: 'Rahul Verma', email: 'rahul.verma@company.com', emp_id: 'EMP-003', dept: 'Finance', desig: 'Financial Analyst', joining: '2023-01-10' },
      { name: 'Sneha Nair', email: 'sneha.nair@company.com', emp_id: 'EMP-004', dept: 'Marketing', desig: 'Content Writer', joining: '2024-02-20' },
      { name: 'Vikram Singh', email: 'vikram.singh@company.com', emp_id: 'EMP-005', dept: 'Operations', desig: 'Project Coordinator', joining: '2022-11-05' },
      { name: 'Anjali Gupta', email: 'anjali.gupta@company.com', emp_id: 'EMP-006', dept: 'Engineering', desig: 'Senior Developer', joining: '2021-09-15' },
      { name: 'Rohit Kumar', email: 'rohit.kumar@company.com', emp_id: 'EMP-007', dept: 'Finance', desig: 'Accountant', joining: '2023-06-01' },
      { name: 'Meera Joshi', email: 'meera.joshi@company.com', emp_id: 'EMP-008', dept: 'Marketing', desig: 'Brand Designer', joining: '2024-01-15' },
    ];

    const employeePassword = 'Employee@123';
    const empHash = await bcrypt.hash(employeePassword, 12);
    const currentYear = new Date().getFullYear();
    const leaveTypes = [
      { type: 'casual', allocated: 12 },
      { type: 'sick', allocated: 12 },
      { type: 'earned', allocated: 15 },
      { type: 'unpaid', allocated: 0 },
    ];

    for (const emp of employees) {
      const empResult = await client.query(
        `INSERT INTO users (name, email, password_hash, role, employee_id, department, designation, joining_date)
         VALUES ($1, $2, $3, 'employee', $4, $5, $6, $7)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [emp.name, emp.email, empHash, emp.emp_id, emp.dept, emp.desig, emp.joining]
      );

      let empId;
      if (empResult.rows.length > 0) {
        empId = empResult.rows[0].id;
      } else {
        const existing = await client.query('SELECT id FROM users WHERE email = $1', [emp.email]);
        empId = existing.rows[0]?.id;
      }

      if (empId) {
        for (const lt of leaveTypes) {
          await client.query(
            `INSERT INTO leave_balances (user_id, leave_type, allocated, used, pending, available, year)
             VALUES ($1, $2, $3, 0, 0, $3, $4)
             ON CONFLICT (user_id, leave_type, year) DO NOTHING`,
            [empId, lt.type, lt.allocated, currentYear]
          );
        }
      }
    }

    console.log('✅ Sample employees & default leave balances configured');
    await client.query('COMMIT');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📧 Admin Login:');
    console.log(`   Email:    ${process.env.ADMIN_EMAIL || 'admin@company.com'}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n📧 Employee Login (Sample):');
    console.log('   Email:    arjun.sharma@company.com');
    console.log(`   Password: ${employeePassword}\n`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
