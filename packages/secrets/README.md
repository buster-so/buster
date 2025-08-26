# @buster/secrets

Centralized secrets management for the Buster monorepo using Infisical with local `.env` fallback support.

## Features

- **Priority-based secret resolution**: `.env` file → Infisical (real-time fetch)
- **Real-time fetching**: Always gets the latest secret values from Infisical
- **Lazy initialization**: Only connects to Infisical when needed
- **Automatic .env loading**: Loads from monorepo root automatically
- **Backward compatible**: Works with existing `.env` files
- **Type-safe**: Full TypeScript support

## Installation

```bash
pnpm add @buster/secrets
```

## Usage

### Basic Usage

```typescript
import { getSecret } from '@buster/secrets';

// Replace process.env calls
const apiKey = await getSecret('API_KEY');
const dbUrl = await getSecret('DATABASE_URL');
```

### Synchronous Usage (Limited)

```typescript
import { getSecretSync } from '@buster/secrets';

// Only works with .env values or pre-loaded Infisical secrets
const apiKey = getSecretSync('API_KEY');
```

### Preload Secrets at Startup

```typescript
import { preloadSecrets } from '@buster/secrets';

// Load all secrets at app startup
await preloadSecrets();

// Now getSecretSync will work for all secrets
const apiKey = getSecretSync('API_KEY');
```

## Configuration

### Local Development with .env

No configuration needed! Just use your existing `.env` file at the monorepo root.

### Using Infisical

Set these environment variables to enable Infisical:

```bash
# Required
INFISICAL_CLIENT_ID=your-client-id
INFISICAL_CLIENT_SECRET=your-client-secret
INFISICAL_PROJECT_ID=your-project-id

# Optional (defaults to 'development')
INFISICAL_ENVIRONMENT=development|staging|production

# Optional (for self-hosted Infisical)
INFISICAL_SITE_URL=https://your-infisical-instance.com
```

## Migration Guide

### Before (using process.env)

```typescript
export function getGitHubAppCredentials() {
  const appId = process.env.GITHUB_APP_ID;
  if (!appId) {
    throw new Error('GITHUB_APP_ID not set');
  }
  return { appId };
}
```

### After (using getSecret)

```typescript
import { getSecret } from '@buster/secrets';

export async function getGitHubAppCredentials() {
  const appId = await getSecret('GITHUB_APP_ID');
  return { appId };
}
```

## How It Works

1. **Environment Variables**: First checks `process.env` (includes `.env` file values)
2. **Infisical**: If not found locally, fetches from Infisical in real-time (if configured)
3. **Error**: Throws if secret not found anywhere

No caching - always gets the latest values!

## Testing

For testing, you can create a custom instance:

```typescript
import { createSecretManager } from '@buster/secrets';

const testManager = createSecretManager({
  environment: 'test',
  clientId: 'test-client',
  clientSecret: 'test-secret',
  projectId: 'test-project'
});

const secret = await testManager.getSecret('TEST_SECRET');
```

## Best Practices

1. **Use async `getSecret()` by default** - It handles all cases
2. **Preload at startup** - Call `preloadSecrets()` in your app initialization
3. **Keep .env for local dev** - Easier for developers, no Infisical setup needed
4. **Use Infisical in CI/Production** - Centralized secrets management

## Environment Priority

The package respects this priority order:

1. **Memory cache** (fastest)
2. **process.env / .env file** (local override)
3. **Infisical** (centralized source)

This allows developers to override any Infisical secret locally by setting it in their `.env` file.