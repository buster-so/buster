# Multi-stage Dockerfile with Turborepo optimization for TypeScript/Bun server

# Stage 1: Base
FROM node:20-slim AS base
RUN npm install -g pnpm@10 turbo
WORKDIR /app

# Stage 2: Prune the monorepo for the server app
FROM base AS pruner
COPY . .
RUN turbo prune @buster-app/server --docker

# Stage 3: Install dependencies
FROM base AS deps
# First copy pruned lockfile and package files
COPY --from=pruner /app/out/json/ .
# Install dependencies (including dev for building)
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Stage 4: Build the application
FROM base AS builder
# Copy installed node_modules from deps stage
COPY --from=deps /app/ .
# Copy pruned source code
COPY --from=pruner /app/out/full/ .
# Build with Turbo
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

# Stage 5: Production dependencies
FROM base AS prod-deps
COPY --from=pruner /app/out/json/ .
RUN pnpm install --prod --no-frozen-lockfile --ignore-scripts

# Stage 6: Production runtime
FROM oven/bun:slim AS runtime
WORKDIR /app

# Copy production dependencies from prod-deps stage
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/server/node_modules ./apps/server/node_modules  
COPY --from=prod-deps /app/packages/*/node_modules ./packages/*/node_modules

# Copy built application from builder
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