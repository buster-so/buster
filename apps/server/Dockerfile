# Ultra-fast Dockerfile using published base image
# ================================================================
# Prerequisites: Pull the published base image:
# docker pull ghcr.io/buster-so/buster-server-base:latest
# 
# This Dockerfile handles:
# - Incremental dependency updates (new versions since base was built)
# - Source code building
# - Production runtime

FROM ghcr.io/buster-so/server-base:latest AS builder
# Note: Base image already has tools (node, pnpm, bun) + most dependencies

RUN echo "=== ULTRA-FAST BUILD START: $(date) ==="

# Update package files (in case they changed since base was built)
COPY package.json pnpm-lock.yaml* turbo.json* pnpm-workspace.yaml* ./
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

# Incremental install - only installs NEW/UPDATED packages since base
RUN echo "=== Incremental dependency update: $(date) ===" && \
    time pnpm install --ignore-scripts && \
    echo "=== Dependencies updated: $(date) ==="

RUN echo "=== Running turbo build: $(date) ===" && \
    time turbo run build --filter=@buster-app/server && \
    echo "=== Turbo build complete: $(date) ==="


# Build the application (fast with bun)
RUN echo "=== Building application: $(date) ===" && \
    cd apps/server && \
    time bun build src/index.ts --outdir ./dist --target bun --minify && \
    echo "Build complete - output:" && \
    ls -la dist/ && \
    echo "=== BUILD COMPLETE: $(date) ==="

# Production runtime (minimal bun image)
FROM oven/bun:1.2.15-alpine AS runtime
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV DOCKER_CONTAINER=true

# Create non-root user
RUN addgroup --system --gid 1001 bunuser && \
    adduser --system --uid 1001 bunuser

# Copy built application and dependencies
COPY --from=builder --chown=bunuser:bunuser /app/apps/server/dist ./dist
COPY --from=builder --chown=bunuser:bunuser /app/apps/server/package.json ./
COPY --from=builder --chown=bunuser:bunuser /app/node_modules ./node_modules

# Show final stats
RUN echo "=== Final production image: $(date) ===" && \
    du -sh /app && \
    echo "Ready to run!"

USER bunuser
EXPOSE 3002

# Health check for production
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:' + (process.env.SERVER_PORT || 3002) + '/healthcheck').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Start the application
CMD ["bun", "run", "dist/index.js"] 