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

exports.updateSpotStatus = async (id, status, claimedBy = null, vehiclePlate = null) => {
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
    
    // If setting to Free, clear data. If Occupied, set data.
    const finalClaimedBy = status === 'Free' ? null : claimedBy;
    const finalVehiclePlate = status === 'Free' ? null : vehiclePlate;
    const finalExpiresAt = status === 'Free' ? null : Date.now() + 60000; // 60 seconds from now
    
    console.log(`[PARKING_SERVICE] Status Transition: ${previousStatus} -> ${status} for ${location} by ${finalClaimedBy}`);
    
    // Update the database
    await db.query('UPDATE parking_spots SET status = ?, claimed_by = ?, vehicle_plate = ?, expires_at = ? WHERE id = ?', 
        [status, finalClaimedBy, finalVehiclePlate, finalExpiresAt, id]);
    
    // Notify specifically if a spot was FREED
    if (previousStatus === 'Occupied' && status === 'Free') {
        const msg = claimedBy ? `Admin evicted user from ${location}` : `Parking sector at ${location} is now FREE!`;
        console.log(`[PARKING_SERVICE] Notification Triggered: NODE_AVAILABLE for ${location}`);
        await notifyService({
            event: 'spot_freed',
            spotId: id,
            location: location,
            message: msg
        });
    } else if (status === 'Occupied') {
        const msg = claimedBy ? `User '${claimedBy}' claimed sector ${location} [${finalVehiclePlate || 'NO PLATE'}]` : `Parking sector at ${location} is now BUSY!`;
        await notifyService({
            event: 'spot_busy',
            spotId: id,
            location: location,
            message: msg
        });

        // Auto-expiry timer (60 seconds)
        setTimeout(async () => {
            try {
                // Verify it's still occupied by the same expiry timestamp before freeing
                const [checkRows] = await db.query('SELECT expires_at FROM parking_spots WHERE id = ?', [id]);
                if (checkRows.length > 0 && checkRows[0].expires_at === finalExpiresAt) {
                    console.log(`[PARKING_SERVICE] Auto-expiring spot ${location}`);
                    await exports.updateSpotStatus(id, 'Free');
                }
            } catch (err) {
                console.error(`[PARKING_SERVICE] Auto-expiry failed for ${location}:`, err.message);
            }
        }, 60000);
    }
    
    // General update for dashboard sync
    await notifyService({ event: 'update' });
    
    return { id, status, location, claimed_by: finalClaimedBy, message: 'Status updated successfully' };
};

exports.resetAllSpots = async () => {
    await db.query('UPDATE parking_spots SET status = "Free", claimed_by = NULL');
    await notifyService({
        event: 'spot_freed',
        message: 'SYSTEM OVERRIDE: All parking sectors have been reset to FREE.'
    });
    await notifyService({ event: 'update' });
    return { message: 'All spots reset successfully' };
};

exports.addSpot = async (location) => {
    const [result] = await db.query('INSERT INTO parking_spots (location, status, claimed_by) VALUES (?, "Free", NULL)', [location]);
    await notifyService({
        event: 'spot_freed',
        message: `SYSTEM UPDATE: New sector '${location}' added to the grid.`
    });
    await notifyService({ event: 'update' });
    return { id: result.insertId, location, status: 'Free' };
};
