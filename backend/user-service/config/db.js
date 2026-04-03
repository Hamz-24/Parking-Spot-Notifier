/** 
 * IN-MEMORY MOCK DATABASE (USER-SERVICE)
 * Updated to support Role-Based Access Control (RBAC).
 */

const users = [];

const dbMock = {
    query: async (sql, params) => {
        console.log(`[DB_MOCK] Executing: ${sql}`, params);

        // Simple SELECT for login/check
        if (sql.includes('SELECT * FROM users WHERE username = ?')) {
            const username = params[0];
            const found = users.filter(u => u.username === username);
            return [found];
        }

        // Simple INSERT for registration (support role)
        if (sql.includes('INSERT INTO users')) {
            const [username, password, role] = params;
            const newUser = { 
                id: users.length + 1, 
                username, 
                password, 
                role: role || 'user' 
            };
            users.push(newUser);
            return [{ insertId: newUser.id }];
        }

        return [[]]; // Default empty
    }
};

module.exports = dbMock;
