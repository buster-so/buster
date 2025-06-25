# Slack Package Foundation - Product Requirements Document

## Overview

This PRD establishes the foundational infrastructure for a standalone Slack integration package. It covers core types, interfaces, and utilities that enable OAuth authentication and messaging capabilities. The package is designed to be framework-agnostic and has no external dependencies on databases or specific storage implementations.

## Architecture Approach

### Package Structure
```
packages/
  slack/
    src/
      types/
        index.ts          # Zod schemas and inferred types
        errors.ts         # Error types and schemas
      services/
        auth.ts           # OAuth flow service
        channels.ts       # Channel management service
        messaging.ts      # Message sending service
      interfaces/
        token-storage.ts  # Token storage interface
      utils/
        validation-helpers.ts  # Zod validation utilities
        message-formatter.ts   # Message formatting helpers
      index.ts            # Package exports
    package.json
    tsconfig.json
    vitest.config.ts
```

### Package Dependencies
```json
{
  "name": "@buster/slack",
  "version": "1.0.0",
  "dependencies": {
    "zod": "^3.22.4",
    "@slack/web-api": "^6.10.0"
  },
  "devDependencies": {
    "@buster/typescript-config": "workspace:*",
    "@buster/vitest-config": "workspace:*",
    "vitest": "^1.2.0"
  }
}
```

## Core Types & Schemas

### 1. Integration Data Types

```typescript
import { z } from 'zod';

// Integration result schema - returned after successful OAuth
export const SlackIntegrationResultSchema = z.object({
  teamId: z.string(),
  teamName: z.string(),
  teamDomain: z.string().optional(),
  botUserId: z.string(),
  scope: z.string(),
  installerUserId: z.string(),
  enterpriseId: z.string().optional(),
  accessToken: z.string(),
});

export type SlackIntegrationResult = z.infer<typeof SlackIntegrationResultSchema>;

// OAuth state for CSRF protection
export const SlackOAuthStateSchema = z.object({
  state: z.string(),
  expiresAt: z.number(), // Unix timestamp
  metadata: z.record(z.unknown()).optional(), // For app-specific data
});

export type SlackOAuthState = z.infer<typeof SlackOAuthStateSchema>;
```

### 2. OAuth Types

#### `packages/slack/src/types/index.ts`
```typescript
import { z } from 'zod';

// OAuth Response from Slack API
export const SlackOAuthResponseSchema = z.object({
  ok: z.boolean(),
  access_token: z.string(),
  token_type: z.string(),
  scope: z.string(),
  bot_user_id: z.string(),
  app_id: z.string(),
  team: z.object({
    id: z.string(),
    name: z.string(),
    domain: z.string().optional(),
  }),
  enterprise: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  authed_user: z.object({
    id: z.string(),
    scope: z.string(),
    access_token: z.string().optional(),
    token_type: z.string().optional(),
  }),
  is_enterprise_install: z.boolean().optional(),
});

export type SlackOAuthResponse = z.infer<typeof SlackOAuthResponseSchema>;

// OAuth configuration
export const SlackOAuthConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).default([
    'channels:read',
    'chat:write',
    'chat:write.public',
  ]),
});

export type SlackOAuthConfig = z.infer<typeof SlackOAuthConfigSchema>;

// Message Types
export const SlackMessageSchema = z.object({
  text: z.string().optional(),
  blocks: z.array(z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  thread_ts: z.string().optional(),
  unfurl_links: z.boolean().optional(),
  unfurl_media: z.boolean().optional(),
});

export type SlackMessage = z.infer<typeof SlackMessageSchema>;

// Channel Information
export const SlackChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_private: z.boolean(),
  is_archived: z.boolean(),
  is_member: z.boolean().optional(),
});

export type SlackChannel = z.infer<typeof SlackChannelSchema>;

// Send message result
export const SendMessageResultSchema = z.object({
  success: z.boolean(),
  messageTs: z.string().optional(),
  channelId: z.string().optional(),
  error: z.string().optional(),
});

export type SendMessageResult = z.infer<typeof SendMessageResultSchema>;
```

### 3. Error Types

#### `packages/slack/src/types/errors.ts`
```typescript
import { z } from 'zod';

export const SlackErrorCodeSchema = z.enum([
  'OAUTH_ACCESS_DENIED',
  'OAUTH_INVALID_STATE', 
  'OAUTH_TOKEN_EXCHANGE_FAILED',
  'INVALID_TOKEN',
  'CHANNEL_NOT_FOUND',
  'NOT_IN_CHANNEL',
  'RATE_LIMITED',
  'NETWORK_ERROR',
  'UNKNOWN_ERROR',
]);

export type SlackErrorCode = z.infer<typeof SlackErrorCodeSchema>;

export const SlackErrorSchema = z.object({
  code: SlackErrorCodeSchema,
  message: z.string(),
  retryable: z.boolean().default(false),
  details: z.record(z.unknown()).optional(),
});

export type SlackError = z.infer<typeof SlackErrorSchema>;

export class SlackIntegrationError extends Error {
  constructor(
    public readonly code: SlackErrorCode,
    message: string,
    public readonly retryable: boolean = false,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SlackIntegrationError';
  }
}
```

## Interfaces

### 4. Token Storage Interface

#### `packages/slack/src/interfaces/token-storage.ts`
```typescript
import { z } from 'zod';

/**
 * Interface for token storage implementations.
 * Consuming applications must implement this interface
 * to store and retrieve Slack access tokens securely.
 */
export interface ISlackTokenStorage {
  /**
   * Store a Slack access token
   * @param key Unique identifier for the token (e.g., userId, integrationId)
   * @param token The access token to store
   */
  storeToken(key: string, token: string): Promise<void>;

  /**
   * Retrieve a Slack access token
   * @param key Unique identifier for the token
   * @returns The access token or null if not found
   */
  getToken(key: string): Promise<string | null>;

  /**
   * Delete a Slack access token
   * @param key Unique identifier for the token
   */
  deleteToken(key: string): Promise<void>;

  /**
   * Check if a token exists
   * @param key Unique identifier for the token
   */
  hasToken(key: string): Promise<boolean>;
}

/**
 * Interface for OAuth state storage.
 * Used to store temporary OAuth state for CSRF protection.
 */
export interface ISlackOAuthStateStorage {
  /**
   * Store OAuth state
   * @param state The state string
   * @param data State data including expiry
   */
  storeState(state: string, data: SlackOAuthStateData): Promise<void>;

  /**
   * Retrieve and validate OAuth state
   * @param state The state string
   * @returns State data if valid and not expired, null otherwise
   */
  getState(state: string): Promise<SlackOAuthStateData | null>;

  /**
   * Delete OAuth state
   * @param state The state string
   */
  deleteState(state: string): Promise<void>;
}

export const SlackOAuthStateDataSchema = z.object({
  expiresAt: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export type SlackOAuthStateData = z.infer<typeof SlackOAuthStateDataSchema>;
```

## Utility Functions

### 5. Validation Helpers

#### `packages/slack/src/utils/validation-helpers.ts`
```typescript
import { z } from 'zod';
import { SlackIntegrationError } from '../types/errors';

/**
 * Safely parse data with Zod schema
 * @param schema The Zod schema to use
 * @param data The data to parse
 * @param errorMessage Custom error message
 * @returns Parsed data
 * @throws SlackIntegrationError if validation fails
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage: string
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new SlackIntegrationError(
      'UNKNOWN_ERROR',
      errorMessage,
      false,
      { zodError: result.error.flatten() }
    );
  }
  
  return result.data;
}

/**
 * Generate secure random state for OAuth
 * @returns Cryptographically secure random string
 */
export function generateSecureState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if OAuth state has expired
 * @param expiresAt Unix timestamp
 * @returns true if expired
 */
export function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

### 6. Message Formatting Helpers

#### `packages/slack/src/utils/message-formatter.ts`
```typescript
import { z } from 'zod';
import type { SlackMessage } from '../types';

/**
 * Format a simple text message
 */
export function formatSimpleMessage(
  text: string,
  options?: { markdown?: boolean }
): SlackMessage {
  return {
    text,
    mrkdwn: options?.markdown,
  };
}

/**
 * Format a message with blocks
 */
export function formatBlockMessage(
  blocks: Array<any>,
  fallbackText?: string
): SlackMessage {
  return {
    text: fallbackText || 'New message',
    blocks,
  };
}

/**
 * Create a section block
 */
export function createSectionBlock(
  text: string,
  options?: {
    fields?: Array<{ title: string; value: string }>;
    accessory?: any;
  }
): any {
  const block: any = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text,
    },
  };

  if (options?.fields) {
    block.fields = options.fields.map(field => ({
      type: 'mrkdwn',
      text: `*${field.title}*\n${field.value}`,
    }));
  }

  if (options?.accessory) {
    block.accessory = options.accessory;
  }

  return block;
}

/**
 * Create an actions block with buttons
 */
export function createActionsBlock(
  actions: Array<{
    text: string;
    value: string;
    style?: 'primary' | 'danger';
    url?: string;
  }>
): any {
  return {
    type: 'actions',
    elements: actions.map(action => ({
      type: action.url ? 'button' : 'button',
      text: {
        type: 'plain_text',
        text: action.text,
      },
      value: action.value,
      style: action.style,
      url: action.url,
    })),
  };
}

## Package Exports

### 7. Main Export File

#### `packages/slack/src/index.ts`
```typescript
// Types
export * from './types';
export * from './types/errors';

// Services
export { SlackAuthService } from './services/auth';
export { SlackChannelService } from './services/channels';
export { SlackMessagingService } from './services/messaging';

// Interfaces
export type { ISlackTokenStorage, ISlackOAuthStateStorage } from './interfaces/token-storage';

// Utils
export * from './utils/validation-helpers';
export * from './utils/message-formatter';

// Version
export const VERSION = '1.0.0';

## Example Usage

### 8. Basic Integration Example

```typescript
import { 
  SlackAuthService,
  SlackMessagingService,
  type ISlackTokenStorage,
  type ISlackOAuthStateStorage,
  SlackOAuthConfig
} from '@buster/slack';

// Implement token storage
class MyTokenStorage implements ISlackTokenStorage {
  async storeToken(key: string, token: string): Promise<void> {
    // Store in your database, Redis, etc.
  }
  
  async getToken(key: string): Promise<string | null> {
    // Retrieve from your storage
  }
  
  async deleteToken(key: string): Promise<void> {
    // Delete from your storage
  }
  
  async hasToken(key: string): Promise<boolean> {
    // Check if token exists
  }
}

// Implement OAuth state storage
class MyOAuthStateStorage implements ISlackOAuthStateStorage {
  // Implementation...
}

// Initialize services
const config: SlackOAuthConfig = {
  clientId: process.env.SLACK_CLIENT_ID!,
  clientSecret: process.env.SLACK_CLIENT_SECRET!,
  redirectUri: 'https://myapp.com/slack/callback',
};

const tokenStorage = new MyTokenStorage();
const stateStorage = new MyOAuthStateStorage();

const authService = new SlackAuthService(config, tokenStorage, stateStorage);
const messagingService = new SlackMessagingService(tokenStorage);

// Use the services
const { authUrl, state } = await authService.generateAuthUrl();
// ... handle OAuth flow ...

const result = await messagingService.sendMessage(
  'user-123',
  'C1234567890',
  { text: 'Hello from Buster!' }
);
```

## Testing Strategy

### 9. Unit Test Structure

```typescript
// packages/slack/src/services/__tests__/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { SlackAuthService } from '../auth';
import type { ISlackTokenStorage, ISlackOAuthStateStorage } from '../../interfaces/token-storage';

describe('SlackAuthService', () => {
  const mockTokenStorage: ISlackTokenStorage = {
    storeToken: vi.fn(),
    getToken: vi.fn(),
    deleteToken: vi.fn(),
    hasToken: vi.fn(),
  };
  
  const mockStateStorage: ISlackOAuthStateStorage = {
    storeState: vi.fn(),
    getState: vi.fn(),
    deleteState: vi.fn(),
  };
  
  const config = {
    clientId: 'test-client',
    clientSecret: 'test-secret',
    redirectUri: 'https://test.com/callback',
  };
  
  it('should generate auth URL with state', async () => {
    const service = new SlackAuthService(config, mockTokenStorage, mockStateStorage);
    const { authUrl, state } = await service.generateAuthUrl();
    
    expect(authUrl).toContain('slack.com/oauth/v2/authorize');
    expect(authUrl).toContain('client_id=test-client');
    expect(state).toBeTruthy();
    expect(mockStateStorage.storeState).toHaveBeenCalled();
  });
});
```

## Success Criteria

- ✅ Standalone package with no database dependencies
- ✅ Type safety enforced through Zod schemas
- ✅ Token storage abstracted through interfaces
- ✅ Framework-agnostic design
- ✅ Comprehensive error handling
- ✅ Unit tests with mocked dependencies
- ✅ Uses official @slack/web-api types

## Next Steps

This foundation enables the implementation of:
1. **Slack OAuth Service PRD** - OAuth flow implementation
2. **Slack Messaging Service PRD** - Channel selection and message sending

Both will build on these core types and interfaces.