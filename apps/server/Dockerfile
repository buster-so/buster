# Reliable Dockerfile: Node.js for deps + Bun for build/runtime
# =============================================================

# Stage 1: Install dependencies with Node.js + pnpm
FROM node:22-alpine AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY turbo.json* ./
COPY pnpm-workspace.yaml* ./

# Copy all workspace packages and apps
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install dependencies with pnpm (skip problematic scripts)
RUN pnpm install --ignore-scripts

# Stage 2: Build with native Bun image
FROM oven/bun:1.2.15 AS build
WORKDIR /app

# Copy installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps

# Copy workspace configuration
COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY turbo.json* ./
COPY pnpm-workspace.yaml* ./

# Build the server
WORKDIR /app/apps/server
RUN bun run build

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
