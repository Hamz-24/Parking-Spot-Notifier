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
        console.log('[DB_INIT] Checking schema updates...');
        try {
            await db.query(`ALTER TABLE parking_spots ADD COLUMN claimed_by VARCHAR(100) DEFAULT NULL`);
        } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message); }
        
        try {
            await db.query(`ALTER TABLE parking_spots ADD COLUMN vehicle_plate VARCHAR(50) DEFAULT NULL`);
        } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message); }
        
        try {
            await db.query(`ALTER TABLE parking_spots ADD COLUMN expires_at BIGINT DEFAULT NULL`);
        } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message); }
        
        console.log('[DB_INIT] Schema migration checks completed.');
    } catch (err) {
        console.log(`[DB_INIT] Migration check failed: ${err.message}`);
    }
}

app.listen(port, async () => {
    await initDB();
    console.log(`Parking-Service is running on port ${port}`);
});
