const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(morgan('dev'));

/**
 * SERVE FRONTEND (STATIC FILES)
 * This allows you to access the UI at http://localhost:3000
 */
app.use(express.static(path.join(__dirname, '../../frontend')));

// Standard Proxies (Backend Microservices)
app.use('/auth', createProxyMiddleware({ target: 'http://localhost:3001/auth', changeOrigin: true }));
app.use('/parking', createProxyMiddleware({ target: 'http://localhost:3002/parking', changeOrigin: true }));

/**
 * SSE Proxy for Notification Service
 * Optimized for persistent, non-buffered connections
 */
app.use('/notification', createProxyMiddleware({ 
    target: 'http://localhost:3003/notification', 
    changeOrigin: true,
    ws: true,
    proxyTimeout: 0,
    timeout: 0,
    onProxyRes: (proxyRes) => {
        proxyRes.headers['X-Accel-Buffering'] = 'no';
        proxyRes.headers['Connection'] = 'keep-alive';
        proxyRes.headers['Cache-Control'] = 'no-cache';
    }
}));

// Health Check Proxying
app.use('/health/user', createProxyMiddleware({ target: 'http://localhost:3001/health', changeOrigin: true }));
app.use('/health/parking', createProxyMiddleware({ target: 'http://localhost:3002/health', changeOrigin: true }));
app.use('/health/notification', createProxyMiddleware({ target: 'http://localhost:3003/health', changeOrigin: true }));

// Default Route for UI (fallback to index.html for SPA-like feel)
app.get('/*splat', (req, res) => {
    // Only serve index.html if it's not an API call
    if (!req.path.startsWith('/auth') && !req.path.startsWith('/parking') && !req.path.startsWith('/notification')) {
        const filePath = path.join(__dirname, '../../frontend/index.html');
        res.sendFile(filePath);
    }
});

app.listen(PORT, () => {
    console.log(`\n\x1b[32m[SYSTEM_UPLINK] Complete stack active!\x1b[0m`);
    console.log(`\x1b[36m-> LIVE SIMULATOR:\x1b[0m http://localhost:3000\n`);
});
