# Optimized Dockerfile for Next.js in Turborepo monorepo
# Uses turbo prune for minimal production images

# 1. Base stage with pnpm
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 2. Pruner stage - creates minimal subset of monorepo
FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo prune @buster-app/web --docker

# 3. Builder stage
FROM base AS builder
WORKDIR /app

# Build arguments for NEXT_PUBLIC_* variables
# Porter will pass these via --build-arg
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API2_URL
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_WEB_SOCKET_URL
# PostHog analytics (commented out for now)
# ARG NEXT_PUBLIC_POSTHOG_KEY
# ARG NEXT_PUBLIC_POSTHOG_HOST

# Set build-time environment variables
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API2_URL=$NEXT_PUBLIC_API2_URL
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_WEB_SOCKET_URL=$NEXT_PUBLIC_WEB_SOCKET_URL
# PostHog vars commented out to avoid validation errors
# ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
# ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

# Skip environment validation during build
ENV SKIP_ENV_CHECK=true
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy pruned dependencies and install
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# Use --no-frozen-lockfile to handle pruned dependencies correctly
RUN pnpm install --no-frozen-lockfile

# Copy pruned source code
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

# Build the application
RUN pnpm turbo run build --filter=@buster-app/web...

# 4. Production runner stage
FROM gcr.io/distroless/nodejs20-debian12 AS runner
WORKDIR /app

# Production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output from builder
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# The standalone server is at ./apps/web/server.js
EXPOSE 3000

# Start the standalone server
CMD ["apps/web/server.js"]
