const authService = require('./service');

exports.register = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        const userId = await authService.registerUser(username, password, role);
        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
        if (error.message === 'Username already exists') {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        const data = await authService.loginUser(username, password);
        res.status(200).json({ message: 'Login successful', ...data });
    } catch (error) {
        if (error.message === 'Invalid username or password') {
            return res.status(401).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
