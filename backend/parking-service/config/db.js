/** 
 * IN-MEMORY MOCK DATABASE (PARKING-SERVICE)
 * Updated to return CLONED objects to prevent reference bleeding.
 */

const spots = [
    { id: 1, location: 'Sector A-101', status: 'Free' },
    { id: 2, location: 'Sector A-102', status: 'Occupied' },
    { id: 3, location: 'Sector B-201', status: 'Free' },
    { id: 4, location: 'Sector B-202', status: 'Free' },
    { id: 5, location: 'Sector C-301', status: 'Occupied' },
    { id: 6, location: 'Sector C-302', status: 'Free' }
];

const dbMock = {
    query: async (sql, params) => {
        // Deep clone for safety
        const clone = (data) => JSON.parse(JSON.stringify(data));

        console.log(`[DB_MOCK] Executing: ${sql}`, params);

        // GET all spots
        if (sql.includes('SELECT * FROM parking_spots ORDER BY id ASC')) {
            return [clone(spots)];
        }

        // GET specific spot
        if (sql.includes('SELECT * FROM parking_spots WHERE id = ?')) {
            const spot = spots.find(s => s.id == params[0]);
            return spot ? [[clone(spot)]] : [[]];
        }

        // UPDATE status
        if (sql.includes('UPDATE parking_spots SET status = ? WHERE id = ?')) {
            const [status, id] = params;
            const spotIndex = spots.findIndex(s => s.id == id);
            if (spotIndex !== -1) {
                spots[spotIndex].status = status;
                return [{ affectedRows: 1 }];
            }
        }

        return [[]]; // Default empty
    }
};

module.exports = dbMock;
