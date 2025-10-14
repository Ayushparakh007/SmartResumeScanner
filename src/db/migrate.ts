import fs from 'fs';
import path from 'path';
import { getPool, testConnection } from './config';

/**
 * Run database migrations
 */
async function migrate() {
  console.log('🔄 Starting database migration...');
  
  // Test connection first
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ Cannot connect to database. Please check your configuration.');
    process.exit(1);
  }
  
  const pool = getPool();
  
  try {
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    
    console.log('📄 Executing schema.sql...');
    
    // Execute the schema
    await pool.query(schemaSql);
    
    console.log('✅ Database migration completed successfully!');
    console.log('\nCreated tables:');
    console.log('  - candidates');
    console.log('  - experience');
    console.log('  - education');
    console.log('  - job_descriptions');
    console.log('  - scores');
    console.log('\nCreated views:');
    console.log('  - candidate_profiles');
    console.log('  - recent_scores');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Drop all tables (use with caution!)
 */
async function dropAll() {
  console.log('⚠️  WARNING: This will drop all tables!');
  
  const pool = getPool();
  
  try {
    console.log('🗑️  Dropping views and tables...');
    
    await pool.query(`
      DROP VIEW IF EXISTS recent_scores CASCADE;
      DROP VIEW IF EXISTS candidate_profiles CASCADE;
      DROP TABLE IF EXISTS scores CASCADE;
      DROP TABLE IF EXISTS experience CASCADE;
      DROP TABLE IF EXISTS education CASCADE;
      DROP TABLE IF EXISTS job_descriptions CASCADE;
      DROP TABLE IF EXISTS candidates CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    `);
    
    console.log('✅ All tables and views dropped successfully');
    
  } catch (error) {
    console.error('❌ Drop failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Reset database (drop and recreate)
 */
async function reset() {
  console.log('🔄 Resetting database...');
  await dropAll();
  await migrate();
}

/**
 * Check database status
 */
async function status() {
  console.log('🔍 Checking database status...');
  
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ Cannot connect to database');
    process.exit(1);
  }
  
  const pool = getPool();
  
  try {
    // Check tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Database Tables:');
    if (tablesResult.rows.length === 0) {
      console.log('  (No tables found - run migration)');
    } else {
      for (const row of tablesResult.rows) {
        // Get row count for each table
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${row.table_name}`);
        console.log(`  - ${row.table_name}: ${countResult.rows[0].count} rows`);
      }
    }
    
    // Check views
    const viewsResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Database Views:');
    if (viewsResult.rows.length === 0) {
      console.log('  (No views found)');
    } else {
      for (const row of viewsResult.rows) {
        console.log(`  - ${row.table_name}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// CLI handler
const command = process.argv[2];

switch (command) {
  case 'migrate':
  case 'up':
    migrate();
    break;
  case 'drop':
    dropAll();
    break;
  case 'reset':
    reset();
    break;
  case 'status':
    status();
    break;
  default:
    console.log('Usage: npm run db:migrate [command]');
    console.log('\nCommands:');
    console.log('  migrate, up  - Run migrations (create tables)');
    console.log('  drop         - Drop all tables (DESTRUCTIVE!)');
    console.log('  reset        - Drop and recreate all tables');
    console.log('  status       - Check database status');
    process.exit(1);
}
