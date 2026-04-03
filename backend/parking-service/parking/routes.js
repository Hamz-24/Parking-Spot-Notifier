const express = require('express');
const router = express.Router();
const parkingController = require('./controller');

router.get('/', parkingController.getAllSpots);
router.put('/update/:id', parkingController.updateSpot);

module.exports = router;
