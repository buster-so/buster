# Reliable Dockerfile: Node.js for deps + Bun for build/runtime
# =============================================================

# Stage 1: Install dependencies with Node.js + pnpm
FROM node:22-alpine AS deps
WORKDIR /app

# Install pnpm and turbo
RUN npm install -g pnpm@9.15.0 turbo

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY turbo.json* ./
COPY pnpm-workspace.yaml* ./

# Copy packages and server app (.dockerignore will exclude node_modules and dist)
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

# Install dependencies with pnpm (skip problematic scripts)
RUN pnpm install --ignore-scripts

# Stage 2: Build with native Bun image
FROM oven/bun:1.2.15 AS build
WORKDIR /app

# Install pnpm and turbo using Bun
RUN bun install -g pnpm@9.15.0 turbo

# Copy installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/server ./apps/server

# Copy workspace configuration
COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY turbo.json* ./
COPY pnpm-workspace.yaml* ./

# Build the server using turbo with filter
RUN turbo run build --filter=@buster-app/server

# Stage 3: Production runtime with Bun
FROM oven/bun:1.2.15-alpine AS runtime
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 bunuser
RUN adduser --system --uid 1001 bunuser

# Copy built app
COPY --from=build --chown=bunuser:bunuser /app/apps/server/dist ./dist
COPY --from=build --chown=bunuser:bunuser /app/apps/server/package.json ./package.json

# Switch to non-root user
USER bunuser

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:' + (process.env.SERVER_PORT || 3002) + '/healthcheck').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Start server
CMD ["bun", "run", "dist/index.cjs"]
