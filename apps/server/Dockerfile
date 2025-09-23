# Multi-stage Dockerfile for TypeScript/Bun server

# Stage 1: Build everything
FROM node:20-slim AS builder
RUN npm install -g pnpm@10 bun
WORKDIR /app

# Copy all source files
COPY . .

# Install ALL dependencies and build
RUN pnpm install --no-frozen-lockfile --ignore-scripts
ENV NODE_ENV=production
ENV DOCKER_BUILD=true
ENV CI=true
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

# Prepare production node_modules
WORKDIR /app
RUN pnpm install --prod --no-frozen-lockfile --ignore-scripts

# Stage 2: Production runtime (matching prebuilt pattern)
FROM oven/bun:alpine AS runtime
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Add build metadata
ARG COMMIT_SHA
ARG BUILD_DATE
LABEL org.opencontainers.image.revision="${COMMIT_SHA}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"

# Create non-root user
RUN addgroup --system --gid 1001 bunuser && \
    adduser --system --uid 1001 bunuser

# Copy built application and production dependencies
COPY --chown=bunuser:bunuser --from=builder /app/apps/server/dist ./dist
COPY --chown=bunuser:bunuser --from=builder /app/node_modules ./node_modules
COPY --chown=bunuser:bunuser --from=builder /app/apps/server/package.json ./

# Show image info
RUN echo "=== Production image ready ===" && \
    echo "Commit: ${COMMIT_SHA:-unknown}" && \
    echo "Built: ${BUILD_DATE:-unknown}" && \
    echo "Size: $(du -sh /app | cut -f1)"

USER bunuser
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:' + (process.env.SERVER_PORT || 3002) + '/healthcheck').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Start the application
CMD ["bun", "run", "dist/index.js"]