import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration from environment variables
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'SmartResumeScanner',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum number of connections
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'), // 2 seconds
  
  // SSL configuration for Render and other cloud providers
  ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : undefined,
};

// Create a singleton connection pool
let pool: Pool | null = null;

/**
 * Get or create the database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    // Log pool errors
    pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
    });

    // Log successful connection
    pool.on('connect', () => {
      console.log('✅ New database connection established');
    });

    console.log(`🔌 Database pool configured for: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
  }
  
  return pool;
}

/**
 * Test the database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connection successful');
    console.log(`   PostgreSQL version: ${result.rows[0].pg_version.split(',')[0]}`);
    console.log(`   Server time: ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Close the database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

/**
 * Execute a query with automatic connection handling
 */
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Query executed in ${duration}ms: ${text.substring(0, 100)}...`);
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient() {
  const pool = getPool();
  return await pool.connect();
}

export default {
  getPool,
  testConnection,
  closePool,
  query,
  getClient,
};
