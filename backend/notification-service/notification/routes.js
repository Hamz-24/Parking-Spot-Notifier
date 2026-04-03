const express = require('express');
const router = express.Router();
const notificationController = require('./controller');

// Public SSE Endpoint
router.get('/stream', notificationController.subscribe);

// Internal Subnet Endpoint
router.post('/internal/notify', notificationController.internalNotify);

module.exports = router;
