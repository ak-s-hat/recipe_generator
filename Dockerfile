# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Set working directory
WORKDIR /app

# Copy dependencies from builder stage
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodeuser:nodejs . .

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]