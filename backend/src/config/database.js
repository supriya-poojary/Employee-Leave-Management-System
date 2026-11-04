import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isRemoteDb =
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('localhost') &&
  !process.env.DATABASE_URL.includes('127.0.0.1');

const isProduction = process.env.NODE_ENV === 'production';

// PostgreSQL pool (supporting transactions & row locking)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
  ssl: isRemoteDb || isProduction ? { rejectUnauthorized: false } : false,
});

// Supabase client (initialized if credentials are provided)
export const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('Executed query', {
      text: typeof text === 'string' ? text.substring(0, 80).replace(/\s+/g, ' ') : 'query',
      duration: `${duration}ms`,
      rows: res.rowCount,
    });
  }
  return res;
};

export const getClient = () => pool.connect();
