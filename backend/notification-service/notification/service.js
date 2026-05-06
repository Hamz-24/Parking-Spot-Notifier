const clients = [];

// Send a heartbeat comment every 3 seconds to prevent idle timeouts from Proxies/Node
setInterval(() => {
    clients.forEach(client => {
        client.write(': heartbeat\n\n');
    });
}, 3000);

exports.addClient = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for stream

    // Send initial handshake
    res.write('data: {"event": "connected"}\n\n');

    clients.push(res);
    console.log(`[NOTIFICATION_SERVICE] New client connected. Active connections: ${clients.length}`);

    req.on('close', () => {
        const index = clients.indexOf(res);
        if (index !== -1) {
            clients.splice(index, 1);
            console.log(`[NOTIFICATION_SERVICE] Client disconnected. Active connections: ${clients.length}`);
        }
    });
};

exports.broadcast = (payload) => {
    console.log(`[NOTIFICATION_SERVICE] Broadcasting ${payload.event} to ${clients.length} clients...`);
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(payload)}\n\n`);
    });
};
