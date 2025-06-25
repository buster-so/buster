# @buster/server2

A Hono-based API server deployed on Vercel.

## Development

Run the development server:

```bash
pnpm start
```

## Deployment

### Initial Setup

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Link your project to Vercel**:
   ```bash
   cd apps/server2
   vercel link
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### Monorepo Configuration

This project is configured to work with the turborepo monorepo:

- **Build Command**: `cd ../.. && pnpm turbo build --filter @buster/server2^...`
  - This builds all workspace dependencies that @buster/server2 depends on
  - The `^...` syntax tells turbo to build dependencies and their dependencies

- **Install Command**: `cd ../.. && pnpm install --frozen-lockfile`
  - This installs dependencies from the monorepo root
  - Uses frozen lockfile for reproducible builds

### Workspace Dependencies

This app depends on these workspace packages:
- `@buster/server-shared` - Shared types and utilities
- `@buster/database` - Database schemas and connections (requires build step)
- `@buster/typescript-config` - TypeScript configuration
- `@buster/vitest-config` - Test configuration

The Vercel configuration automatically builds these dependencies before deploying your app.

## API Routes

- `GET /api` - Health check endpoint
- `POST /api/chats` - Chat creation endpoint