# Use Bun's official image as base
FROM oven/bun:1.1.42-alpine AS base

# Set working directory
WORKDIR /app

# Copy workspace package.json and lock files for dependency resolution
COPY package.json bun.lock ./
COPY tsconfig.base.json ./

# Copy server package.json
COPY server/package.json ./server/

# Install dependencies from workspace root (this handles monorepo dependencies)
RUN bun install --frozen-lockfile

# Build stage
FROM base AS build

# Copy all server source code
COPY server/ ./server/

# Build the server
WORKDIR /app/server
RUN bun run build

# Production stage
FROM oven/bun:1.1.42-alpine AS production

# Set non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bun -u 1001

# Set working directory
WORKDIR /app

# Copy only production dependencies and built app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package.json ./server/

# Change ownership to non-root user
RUN chown -R bun:nodejs /app
USER bun

# Expose the port (matches the default from your server)
EXPOSE 3002

# Set working directory to server
WORKDIR /app/server

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/healthcheck || exit 1

# Start the server
CMD ["bun", "run", "start"] 