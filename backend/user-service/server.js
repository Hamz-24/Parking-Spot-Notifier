const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const authRoutes = require('./auth/routes');
app.use('/auth', authRoutes);

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'user-service' }));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`User-Service is running on port ${port}`);
});
