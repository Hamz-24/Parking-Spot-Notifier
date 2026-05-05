# =============================================================================
# API Gateway — Dockerfile
# Port: 3000 | Serves frontend + reverse-proxies all 3 backend services
# =============================================================================

FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files first (Docker layer caching — only reinstalls if deps change)
COPY package*.json ./

# Install production dependencies only
RUN npm install --production --omit=dev

# Copy application source
COPY . .

# Expose service port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health/user || exit 1

# Start the service
CMD ["node", "server.js"]
