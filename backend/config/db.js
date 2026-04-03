// Mocking mysql2/promise because a local MySQL server is currently unavailable
const mockUsers = [];
const mockSpots = [
    { id: 1, location: 'A1 - Main Entrance', status: 'Free' },
    { id: 2, location: 'A2 - Main Entrance', status: 'Occupied' },
    { id: 3, location: 'B1 - East Wing', status: 'Free' },
    { id: 4, location: 'B2 - East Wing', status: 'Free' },
    { id: 5, location: 'C1 - Underground', status: 'Occupied' },
    { id: 6, location: 'D1 - VIP', status: 'Free' }
];
let userIdCounter = 1;

const pool = {
    query: async (sql, params = []) => {
        // Mocking user queries
        if (sql.includes('INSERT INTO users')) {
            const user = { id: userIdCounter++, username: params[0], password: params[1] };
            mockUsers.push(user);
            return [{ insertId: user.id }];
        }
        if (sql.includes('SELECT * FROM users WHERE username = ?')) {
            const user = mockUsers.find(u => u.username === params[0]);
            return user ? [[user]] : [[]];
        }

        // Mocking parking spots queries
        if (sql.includes('SELECT * FROM parking_spots')) {
            if (sql.includes('WHERE id = ?')) {
                const spot = mockSpots.find(s => s.id == params[0]);
                return spot ? [[spot]] : [[]];
            }
            return [mockSpots];
        }
        if (sql.includes('UPDATE parking_spots SET status = ? WHERE id = ?')) {
            const spot = mockSpots.find(s => s.id == params[1]);
            if (spot) {
                spot.status = params[0];
            }
            return [{}];
        }
        
        return [[]]; // Default empty response
    }
};

module.exports = pool;
