# Multi-stage Dockerfile for development and production

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:22-alpine AS dependencies

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================================================
# Stage 2: Development
# ============================================================================
FROM node:22-alpine AS development

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and patches (required for pnpm install)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start development server with watch mode
CMD ["pnpm", "dev"]

# ============================================================================
# Stage 3: Builder (Production)
# ============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and patches (required for pnpm install)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build backend
RUN pnpm build

# ============================================================================
# Stage 4: Production
# ============================================================================
FROM node:22-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files and patches (required for pnpm install)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/public ./public

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start production server
CMD ["node", "dist/server/_core/index.js"]
