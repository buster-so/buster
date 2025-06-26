# Dockerfile for monorepo workspace - requires workspace root as build context
# ================================================================

# Stage 1: Install dependencies with pnpm (required for workspaces)
FROM node:22-alpine AS deps
WORKDIR /app

# Install required packages for bun installation
RUN apk add --no-cache curl bash

# Install pnpm and turbo
RUN npm install -g pnpm@9.15.0 turbo

# Install bun (needed for the build script)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY turbo.json* ./
COPY pnpm-workspace.yaml* ./

# Copy packages and server app (.dockerignore will exclude node_modules and dist)
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

# Install dependencies with pnpm (required for workspace resolution)
RUN pnpm install --ignore-scripts

# Set NODE_ENV to production for build
ENV NODE_ENV=production

# Build dependencies first using turbo (excluding server)
RUN turbo run build --filter=@buster-app/server

# Build the server manually (this works reliably)
RUN cd apps/server && bun build src/index.ts --outdir ./dist --target bun

# Stage 2: Production runtime with Bun
FROM oven/bun:1.2.15-alpine AS runtime
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 bunuser
RUN adduser --system --uid 1001 bunuser

# Copy built app and dependencies
COPY --from=deps --chown=bunuser:bunuser /app/apps/server/dist ./dist
COPY --from=deps --chown=bunuser:bunuser /app/apps/server/package.json ./package.json
COPY --from=deps --chown=bunuser:bunuser /app/node_modules ./node_modules

# Switch to non-root user
USER bunuser

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:' + (process.env.SERVER_PORT || 3002) + '/healthcheck').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Start server
CMD ["bun", "run", "dist/index.js"]
