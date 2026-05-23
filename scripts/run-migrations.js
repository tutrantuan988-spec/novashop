#!/usr/bin/env node

/**
 * PostgreSQL Migration Runner
 * Runs all SQL migration files in order
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local'), override: true });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

async function runMigrations() {
  console.log('🚀 Starting PostgreSQL migrations...\n');

  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    // Get all migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  No migration files found in', MIGRATIONS_DIR);
      process.exit(0);
    }

    console.log(`📁 Found ${files.length} migration file(s):\n`);
    files.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
    console.log('');

    // Run each migration
    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`⏳ Running migration: ${file}...`);

      const startTime = Date.now();
      await pool.query(sql);
      const duration = Date.now() - startTime;

      console.log(`✅ Completed ${file} (${duration}ms)\n`);
    }

    // Verify schema
    console.log('🔍 Verifying schema...\n');

    const tableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`📊 Created ${tableResult.rows.length} tables:`);
    tableResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');

    // Get row counts
    const tables = tableResult.rows.map(r => r.table_name);
    console.log('📈 Row counts:');
    
    for (const table of tables) {
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = countResult.rows[0].count;
      if (count > 0) {
        console.log(`   - ${table}: ${count} rows`);
      }
    }
    console.log('');

    console.log('✅ All migrations completed successfully!');
    console.log('🎉 Database schema is ready for use\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(`   ${error.message}\n`);
    
    if (error.position) {
      console.error(`   Error at position: ${error.position}`);
    }
    
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }

    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check SQL syntax in migration files');
    console.error('   2. Verify database connection');
    console.error('   3. Check if migrations were already run');
    console.error('   4. Review error message above\n');

    await pool.end();
    process.exit(1);
  }
}

runMigrations();
