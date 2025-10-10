# =============================================================================
# Buster Server Dockerfile - Builds inside Docker with Turbo
# =============================================================================
#
# Build and run:
#   docker build -t buster-server -f apps/server/Dockerfile .
#   docker run -p 3002:3002 --env-file .env buster-server
#
# =============================================================================

FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
RUN bun install -g pnpm

# Copy everything needed for install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .pnpmrc ./

# Create package directory structure first, then copy package.json files
# This ensures pnpm installs dependencies in the right places
RUN mkdir -p apps/server apps/trigger packages/access-controls packages/ai packages/data-source \
    packages/database packages/env-utils packages/github packages/sandbox packages/sdk \
    packages/search packages/server-shared packages/slack packages/test-utils \
    packages/typescript-config packages/vitest-config packages/web-tools

COPY apps/server/package.json ./apps/server/
COPY apps/trigger/package.json ./apps/trigger/
COPY packages/access-controls/package.json ./packages/access-controls/
COPY packages/ai/package.json ./packages/ai/
COPY packages/data-source/package.json ./packages/data-source/
COPY packages/database/package.json ./packages/database/
COPY packages/env-utils/package.json ./packages/env-utils/
COPY packages/github/package.json ./packages/github/
COPY packages/sandbox/package.json ./packages/sandbox/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/search/package.json ./packages/search/
COPY packages/server-shared/package.json ./packages/server-shared/
COPY packages/slack/package.json ./packages/slack/
COPY packages/test-utils/package.json ./packages/test-utils/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/vitest-config/package.json ./packages/vitest-config/
COPY packages/web-tools/package.json ./packages/web-tools/

# Install ALL dependencies - now pnpm will create package-level node_modules
RUN pnpm install --frozen-lockfile

# Build stage - build directly from deps
FROM deps AS build

# Copy ALL source code
COPY . .

# Patch package.json files to remove prebuild scripts (tsx is broken in Docker)
# This removes validation but allows the build to proceed
RUN find /app/packages -name "package.json" -exec sed -i '/"prebuild":/d' {} \; && \
    sed -i '/"prebuild":/d' /app/apps/server/package.json

# Build with Turbo
ENV NODE_ENV=production
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
