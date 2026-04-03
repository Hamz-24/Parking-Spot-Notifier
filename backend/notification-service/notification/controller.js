const notificationService = require('./service');

exports.subscribe = (req, res) => {
    notificationService.addClient(req, res);
};

// Internal webhook triggered by other microservices
exports.internalNotify = (req, res) => {
    try {
        const payload = req.body;
        notificationService.broadcast(payload);
        res.status(200).json({ success: true, message: 'Broadcast triggered' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to broadcast' });
    }
};
