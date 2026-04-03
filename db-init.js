const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function init() {
    try {
        console.log(`Connecting to MySQL at ${process.env.DB_HOST} with user ${process.env.DB_USER}...`);
        // Connect without a specific database first to create it
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || 'password',
            multipleStatements: true
        });
        
        console.log('Connected! Executing database-init.sql...');
        const sql = fs.readFileSync(path.join(__dirname, 'database-init.sql'), 'utf8');
        
        await connection.query(sql);
        console.log('Database initialized successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Initial DB Error:', err.message);
        process.exit(1);
    }
}
init();
