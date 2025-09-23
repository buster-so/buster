# Multi-stage Dockerfile with optimized caching for TypeScript/Bun server

# Stage 1: Base with pnpm
FROM node:20-slim AS base
RUN npm install -g pnpm@9 bun
WORKDIR /app

# Stage 2: Install dependencies (cached layer)
FROM base AS deps
# Copy only package files for dependency installation
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/*/package.json ./packages/*/

# Install ALL dependencies once (both dev and prod)
RUN pnpm install --frozen-lockfile

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

# Stage 4: Production image
FROM oven/bun:slim AS runtime
WORKDIR /app

# Install production dependencies in final image
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/*/package.json ./packages/*/

# Install pnpm and production dependencies
# Using pnpm to properly handle workspace dependencies
RUN bun install --global pnpm@9 && \
    pnpm install --frozen-lockfile --prod --no-optional

# Copy built application
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./

# Runtime configuration
ENV NODE_ENV=production
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun --version || exit 1

# Run the application
CMD ["bun", "dist/index.js"]