# =============================================================================
# Buster Server Dockerfile - Builds inside Docker with Turbo
# =============================================================================
#
# Build and run (from monorepo root):
#   docker build -t buster-server -f apps/server/Dockerfile .
#   docker run -p 3002:3002 --env-file .env.docker buster-server
#
# =============================================================================

FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
RUN bun install -g pnpm

# Copy everything needed for install from monorepo root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .pnpmrc ./

# Copy all package.json files while preserving directory structure
COPY packages ./packages
COPY apps/server/package.json ./apps/server/
COPY apps/trigger/package.json ./apps/trigger/

# Install ALL dependencies - now pnpm will create package-level node_modules
RUN pnpm install --frozen-lockfile

# Build stage - build directly from deps
FROM deps AS build

# Accept Turbo cache tokens as build args
ARG TURBO_TOKEN
ARG TURBO_TEAM

# Copy ALL source code
COPY . .

# Patch package.json files to remove prebuild scripts (tsx is broken in Docker)
# This removes validation but allows the build to proceed
RUN find /app/packages -name "package.json" -exec sed -i '/"prebuild":/d' {} \; && \
    sed -i '/"prebuild":/d' /app/apps/server/package.json

# Build with Turbo (with remote caching if tokens provided)
ENV NODE_ENV=production
ENV TURBO_TOKEN=$TURBO_TOKEN
ENV TURBO_TEAM=$TURBO_TEAM
RUN pnpm turbo build --filter=@buster-app/server...

# Production stage
FROM oven/bun:1-slim
WORKDIR /app

ENV NODE_ENV=production

# Copy workspace structure (needed for pnpm workspace module resolution)
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages

# Copy server and trigger apps (server depends on trigger)
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/server/package.json ./apps/server/package.json
COPY --from=build /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=build /app/apps/trigger ./apps/trigger

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:' + (process.env.SERVER_PORT || 3002) + '/healthcheck').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Run from workspace root so pnpm workspace module resolution works
CMD ["bun", "run", "apps/server/dist/index.js"]
