const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupAivenDB() {
  const uri = 'mysql://avnadmin:AVNS_M1ybDhiOmjg_V9y-9eh@mysql-olst-online-learning-assessment-tool.j.aivencloud.com:21295/defaultdb?ssl-mode=REQUIRED';
  
  console.log('Connecting to Aiven Database...');
  
  try {
    const connection = await mysql.createConnection({
        uri: uri,
        ssl: {
            rejectUnauthorized: false
        },
        multipleStatements: true
    });

    console.log('Success: Connected to Aiven.');

    let schemaPath = path.join(__dirname, 'database', 'schema.sql');
    let schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Remove the CREATE DATABASE and USE statements so it creates them in defaultdb directly
    schemaSQL = schemaSQL.replace(/CREATE DATABASE IF NOT EXISTS elearning_platform[^;]+;/g, '');
    schemaSQL = schemaSQL.replace(/USE elearning_platform;/g, '');

    console.log('Running schema creation script on defaultdb...');
    await connection.query(schemaSQL);

    console.log('Schema executed successfully. Fetching tables to verify...');

    const [rows, fields] = await connection.query('SHOW TABLES');
    
    console.log('\n--- TABLES CREATED ---');
    if (rows.length === 0) {
        console.log('No tables found!');
    } else {
        rows.forEach(row => {
            const tableName = row['Tables_in_defaultdb'];
            console.log(`- ${tableName}`);
        });
    }

    await connection.end();
    console.log('Done.');

  } catch (error) {
    console.error('Error connecting or running schema:', error);
  }
}

setupAivenDB();
