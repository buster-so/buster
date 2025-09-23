# Multi-stage Dockerfile with optimized caching for TypeScript/Bun server

# Stage 1: Base with pnpm
FROM node:20-slim AS base
RUN npm install -g pnpm@10 bun
WORKDIR /app

# Stage 2: Install dependencies (cached layer)
FROM base AS deps
# Copy only package files for dependency installation
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/*/package.json ./packages/*/

# Install ALL dependencies once (both dev and prod)
# Using --no-frozen-lockfile in CI since lockfile may be slightly out of sync
# and --ignore-scripts to speed up install in Docker
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Stage 3: Build application
FROM deps AS builder
# Copy source code
COPY . .

# Build with Turbo (uses cached dependencies)
ENV NODE_ENV=production
ENV DOCKER_BUILD=true
ENV CI=true
ENV TURBO_CACHE_DIR=.turbo
ENV TURBO_TELEMETRY_DISABLED=1
RUN pnpm turbo run build --filter=@buster-app/server...

# Bundle with Bun
WORKDIR /app/apps/server
RUN bun build src/index.ts --outdir ./dist --target bun \
    --external pino-pretty \
    --external @duckdb/node-bindings \
    --external @duckdb/node-bindings-linux-arm64 \
    --external @duckdb/node-bindings-darwin-arm64 \
    --external @duckdb/node-bindings-darwin-x64 \
    --external @duckdb/node-bindings-win32-x64

# Stage 4: Prune dependencies for production
FROM base AS pruner
WORKDIR /app
# Copy lockfile and package files
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/packages/ ./packages/
# Prune to production dependencies only
RUN pnpm install --prod --no-frozen-lockfile --ignore-scripts

# Stage 5: Production image
FROM oven/bun:slim AS runtime
WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./

# Copy pruned production dependencies from pruner
COPY --from=pruner /app/node_modules ./node_modules
COPY --from=pruner /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=pruner /app/packages/*/node_modules ./packages/*/node_modules

# Runtime configuration
ENV NODE_ENV=production
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun --version || exit 1

# Run the application
CMD ["bun", "dist/index.js"]