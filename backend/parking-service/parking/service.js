const db = require('../config/db');

// ─── Notification Service URL ─────────────────────────────────────────────────
// In Docker Compose: uses container name "notification-service"
// Locally: falls back to localhost:3003
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';

// Microservice Communication Helper
async function notifyService(payload) {
    try {
        console.log(`[PARKING_SERVICE] Broadcasting event: ${payload.event} at ${payload.location || 'GLOBAL'}`);
        await fetch(`${NOTIFICATION_SERVICE_URL}/notification/internal/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error('[PARKING_SERVICE] Failed to notify notification-service:', err.message);
    }
}

exports.getSpots = async () => {
    const [rows] = await db.query('SELECT * FROM parking_spots ORDER BY id ASC');
    return rows;
};

exports.updateSpotStatus = async (id, status) => {
    if (!['Free', 'Occupied'].includes(status)) {
        throw new Error('Invalid status');
    }

    // MANDATORY: Get previous status BEFORE update
    const [rows] = await db.query('SELECT * FROM parking_spots WHERE id = ?', [id]);
    if (rows.length === 0) {
        throw new Error('Spot not found');
    }
    
    // Crucial: Object clone ensures previousStatus doesn't change during UPDATE
    const spotBefore = rows[0];
    const previousStatus = spotBefore.status;
    const location = spotBefore.location;
    
    console.log(`[PARKING_SERVICE] Status Transition: ${previousStatus} -> ${status} for ${location}`);
    
    // Update the database
    await db.query('UPDATE parking_spots SET status = ? WHERE id = ?', [status, id]);
    
    // Notify specifically if a spot was FREED
    if (previousStatus === 'Occupied' && status === 'Free') {
        console.log(`[PARKING_SERVICE] Notification Triggered: NODE_AVAILABLE for ${location}`);
        await notifyService({
            event: 'spot_freed',
            spotId: id,
            location: location,
            message: `Parking sector at ${location} is now FREE!`
        });
    } else if (status === 'Occupied') {
        await notifyService({
            event: 'spot_busy',
            spotId: id,
            location: location,
            message: `Parking sector at ${location} is now BUSY!`
        });
    }
    
    // General update for dashboard sync
    await notifyService({ event: 'update' });
    
    return { id, status, location, message: 'Status updated successfully' };
};
