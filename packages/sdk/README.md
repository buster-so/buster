# @buster/sdk

Minimal TypeScript SDK for the Buster API.

## Installation

```bash
pnpm add @buster/sdk
```

## Usage

```typescript
import { createBusterSDK } from '@buster/sdk';

const sdk = createBusterSDK({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.buster.so', // optional
});

// Test connection
const health = await sdk.healthcheck();
console.log('Server status:', health.status);
```

## Configuration

```typescript
interface SDKConfig {
  apiKey: string;           // Required
  apiUrl?: string;          // Default: 'https://api.buster.so'
  timeout?: number;         // Default: 30000ms
  retryAttempts?: number;   // Default: 3
  retryDelay?: number;      // Default: 1000ms
  headers?: Record<string, string>; // Optional custom headers
}
```

## Error Handling

```typescript
import { SDKError, NetworkError } from '@buster/sdk';

try {
  await sdk.healthcheck();
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Connection failed:', error.message);
  } else if (error instanceof SDKError) {
    console.error('API error:', error.statusCode, error.message);
  }
}
```