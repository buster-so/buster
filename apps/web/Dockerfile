# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Only keep build-time public env vars as args
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_WEB_SOCKET_URL

# Set public env vars for build time
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_WEB_SOCKET_URL=$NEXT_PUBLIC_WEB_SOCKET_URL

# Copy package files and install dependencies first for better caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy other necessary configuration files and the rest of the application code
COPY next.config.mjs ./
COPY tsconfig*.json ./
COPY public ./public
COPY . .

# Build with verbose output
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set to production environment
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
# Copy package.json and install only production dependencies in the runtime stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/next.config.mjs ./

# Expose the port your app runs on
EXPOSE 3000

# Add tini for proper signal handling
RUN apk add --no-cache tini

# Use tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["pnpm", "start"]
