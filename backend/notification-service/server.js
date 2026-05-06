const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const app = express();
const port = 3003;

app.use(cors());
app.use(express.json());

const notificationRoutes = require('./notification/routes');
app.use('/notification', notificationRoutes);

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'notification-service' }));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const server = app.listen(port, () => {
    console.log(`Notification-Service is running on port ${port}`);
});

// Extend timeouts for SSE long-lived connections
server.keepAliveTimeout = 120000; // 2 minutes
server.headersTimeout = 120000; // 2 minutes
