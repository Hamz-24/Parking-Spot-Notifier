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

app.listen(port, () => {
    console.log(`Parking-Service is running on port ${port}`);
});
