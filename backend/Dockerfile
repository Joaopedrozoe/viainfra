# Multi-stage build for backend
# Etapa de build 
FROM node:18-slim AS builder

WORKDIR /app

# Install system dependencies (using available OpenSSL)
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    libssl-dev \
    libssl3 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables to help Prisma find OpenSSL
ENV OPENSSL_ROOT_DIR=/usr
ENV OPENSSL_LIB_DIR=/usr/lib/x86_64-linux-gnu
ENV OPENSSL_INCLUDE_DIR=/usr/include/openssl
ENV LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for TypeScript compilation)
RUN npm config set strict-ssl false && npm ci

# Copy Prisma schema and pre-generated client
COPY prisma/ ./prisma/
COPY prisma-generated/ ./node_modules/.prisma/
COPY prisma-client/ ./node_modules/@prisma/

# Skip generation as we have pre-built client

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Etapa final (produção) - Continue using slim for consistency
FROM node:18-slim AS production

WORKDIR /app

# Install minimal system dependencies 
RUN apt-get update && apt-get install -y \
    libssl3 \
    openssl \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables to help Prisma find OpenSSL
ENV OPENSSL_ROOT_DIR=/usr
ENV OPENSSL_LIB_DIR=/usr/lib/x86_64-linux-gnu
ENV OPENSSL_INCLUDE_DIR=/usr/include/openssl
ENV LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH

# Force Prisma to use system OpenSSL and specify binary target
ENV PRISMA_CLIENT_ENGINE_TYPE=library
ENV PRISMA_ENGINE_PROTOCOL=graphql
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x

# Copy package files
COPY package*.json ./

# Install production dependencies including prisma CLI for runtime generation
RUN npm config set strict-ssl false && npm install --production @prisma/client prisma

# Copy built application and necessary files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy package files for potential runtime dependencies
COPY package*.json ./

# Create logs directory
RUN mkdir -p logs

# Create non-root user (Debian syntax)
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs backend

# Change ownership of app directory
RUN chown -R backend:nodejs /app

# Switch to non-root user
USER backend

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Start the application directly
CMD ["node", "dist/index.js"]