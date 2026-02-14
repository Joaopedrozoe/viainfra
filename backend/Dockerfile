# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy Prisma schema
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R backend:nodejs /app

# Switch to non-root user
USER backend

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Start the application
CMD ["npm", "start"]