/**
 * setup-db.js
 * Run with: node setup-db.js [mysql-password]
 * Example:  node setup-db.js
 *           node setup-db.js mypassword
 *
 * This script creates the elearning_platform database,
 * all tables, and seeds the teacher account.
 */
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');
require('dotenv').config();

const password = process.argv[2] ?? (process.env.DB_PASSWORD || '');

async function main() {
  console.log('\n🔌 Connecting to MySQL...');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}:3306`);
  console.log(`   User: ${process.env.DB_USER || 'root'}`);
  console.log(`   Pass: ${password ? '(provided)' : '(empty)'}\n`);

  let conn;
  try {
    conn = await mysql.createConnection({
      host:               process.env.DB_HOST || 'localhost',
      user:               process.env.DB_USER || 'root',
      password:           password,
      multipleStatements: true,
      connectTimeout:     5000,
    });
  } catch (err) {
    console.error('❌ Could not connect to MySQL:', err.message);
    console.error('\n💡 Tips:');
    console.error('   • Make sure XAMPP MySQL is started');
    console.error('   • Try: node setup-db.js YOUR_MYSQL_PASSWORD');
    console.error('   • Check XAMPP → MySQL → Config for the root password');
    process.exit(1);
  }

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
    console.log('📄 Running schema.sql...');
    await conn.query(sql);
    console.log('\n✅ Database "elearning_platform" created successfully!');
    console.log('✅ All tables created.');
    console.log('✅ Teacher account seeded:');
    console.log('      Email:    admin@teacher.com');
    console.log('      Password: securepassword123\n');
    console.log('🚀 You can now start the backend: npm run dev\n');
  } catch (err) {
    console.error('❌ Schema error:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
