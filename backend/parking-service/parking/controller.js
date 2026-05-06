const parkingService = require('./service');

exports.getAllSpots = async (req, res) => {
    try {
        const spots = await parkingService.getSpots();
        res.status(200).json(spots);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch parking spots' });
    }
};

exports.updateSpot = async (req, res) => {
    try {
        const { status, claimedBy, vehiclePlate } = req.body;
        const { id } = req.params;
        
        const result = await parkingService.updateSpotStatus(id, status, claimedBy, vehiclePlate);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Spot not found' || error.message === 'Invalid status') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update parking spot' });
    }
};

exports.resetAllSpots = async (req, res) => {
    try {
        const result = await parkingService.resetAllSpots();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset parking spots' });
    }
};

exports.addSpot = async (req, res) => {
    try {
        const { location } = req.body;
        if (!location) {
            return res.status(400).json({ error: 'Location is required' });
        }
        const result = await parkingService.addSpot(location);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add parking spot' });
    }
};
