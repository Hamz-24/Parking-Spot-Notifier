const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

const parkingRoutes = require('./parking/routes');
app.use('/parking', parkingRoutes);

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'parking-service' }));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const db = require('./config/db');

// Run auto-migration on boot
async function initDB() {
    try {
        console.log('[DB_INIT] Checking for claimed_by column...');
        await db.query(`ALTER TABLE parking_spots ADD COLUMN claimed_by VARCHAR(100) DEFAULT NULL`);
        console.log('[DB_INIT] Successfully added claimed_by column to parking_spots.');
    } catch (err) {
        // Error code ER_DUP_FIELDNAME (1060) means the column already exists. We can ignore it safely.
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('[DB_INIT] Column claimed_by already exists. Skipping migration.');
        } else {
            console.log(`[DB_INIT] Migration check finished: ${err.message}`);
        }
    }
}

app.listen(port, async () => {
    await initDB();
    console.log(`Parking-Service is running on port ${port}`);
});
