# =============================================================================
# Notification Service — Dockerfile
# Port: 3003 | SSE stream, broadcasts spot_freed / spot_busy events
# =============================================================================

FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files first (Docker layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm install --production --omit=dev

# Copy application source
COPY . .

# Expose service port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

# Start the service
CMD ["node", "server.js"]
