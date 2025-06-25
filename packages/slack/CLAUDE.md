# @buster/slack - Claude Code Guidelines

This package provides a standalone Slack integration with OAuth, messaging, and channel management capabilities.

## Architecture Overview

The package is designed to be **completely standalone** with no external dependencies beyond the Slack SDK. It uses an interface-based approach where consuming applications provide their own implementations for storage.

### Core Services

1. **SlackAuthService** - OAuth 2.0 flow implementation
   - Generates authorization URLs with CSRF protection
   - Exchanges codes for access tokens
   - Validates and revokes tokens
   - Requires: `ISlackTokenStorage`, `ISlackOAuthStateStorage`
   - **NEW**: Accepts optional WebClient for dependency injection

2. **SlackChannelService** - Channel management
   - Lists available public channels
   - Validates channel access
   - Joins/leaves channels
   - Accepts access token as parameter
   - **NEW**: Accepts optional WebClient for dependency injection

3. **SlackMessagingService** - Message operations
   - Sends messages with retry logic
   - Supports threading and replies
   - Updates and deletes messages
   - Validates messaging capability
   - Accepts access token as parameter
   - **NEW**: Accepts optional WebClient for dependency injection

### Interfaces

Applications must implement these interfaces:

```typescript
// Token storage
interface ISlackTokenStorage {
  storeToken(key: string, token: string): Promise<void>;
  getToken(key: string): Promise<string | null>;
  deleteToken(key: string): Promise<void>;
  hasToken(key: string): Promise<boolean>;
}

// OAuth state storage (CSRF protection)
interface ISlackOAuthStateStorage {
  storeState(state: string, data: SlackOAuthStateData): Promise<void>;
  getState(state: string): Promise<SlackOAuthStateData | null>;
  deleteState(state: string): Promise<void>;
}

// Message tracking (optional, for threading)
interface ISlackMessageTracking {
  storeMessageTracking(trackingData: MessageTrackingData): Promise<void>;
  getMessageTracking(internalMessageId: string): Promise<MessageTrackingData | null>;
  deleteMessageTracking(internalMessageId: string): Promise<void>;
  getChannelMessages(slackChannelId: string, options?: {...}): Promise<MessageTrackingData[]>;
  hasMessageTracking(internalMessageId: string): Promise<boolean>;
}
```

## Key Design Principles

1. **No Database Dependencies**
   - All storage handled through interfaces
   - Apps choose their own persistence layer

2. **Token-Based Operations**
   - Every function accepts tokens as parameters
   - No internal token storage or vault implementation

3. **Type Safety**
   - **NO `any` types allowed** - Biome enforces this
   - **NO `unknown` types** - Use proper Zod schemas instead
   - All inputs validated with Zod schemas
   - Comprehensive error types with discriminated unions
   - Full TypeScript strict mode compliance

4. **Dependency Injection**
   - All services accept optional WebClient in constructor
   - Makes testing easy without type assertions
   - No need to access private properties in tests

5. **Error Handling**
   - Typed error codes for different scenarios
   - Retry logic with exponential backoff (2^n seconds)
   - User-friendly error messages
   - Proper error discrimination in catch blocks

## Usage Patterns

### OAuth Flow
```typescript
// 1. Generate auth URL
const { authUrl, state } = await authService.generateAuthUrl({ userId });

// 2. User authorizes, Slack redirects back
// 3. Handle callback
const result = await authService.handleCallback(code, state, tokenKey);
```

### Sending Messages
```typescript
// Simple message
await messagingService.sendMessage(token, channelId, { text: 'Hello!' });

// With retry
await messagingService.sendMessageWithRetry(token, channelId, message, 3);

// Threading
const { messageTs } = await messagingService.sendMessage(...);
await messagingService.replyToMessage(token, channelId, messageTs, reply);
```

## Testing Guidelines

- **Tests are located alongside source files** - `*.test.ts` files
- **Mocks are in `src/mocks/`** directory
- **Use dependency injection** - Pass mock WebClient to constructors
- **No type assertions needed** - Clean testing with DI
- Test error scenarios and retry logic
- Ensure all Zod validations are covered

Example test setup:
```typescript
import { createMockWebClient } from '../mocks';
import { SlackMessagingService } from './messaging';
import type { WebClient } from '@slack/web-api';

const mockClient = createMockWebClient();
const service = new SlackMessagingService(mockClient as unknown as WebClient);
```

## Common Pitfalls to Avoid

1. **Don't store tokens internally** - Always accept as parameters
2. **Don't assume channel access** - Always validate first
3. **Don't ignore rate limits** - Use retry logic
4. **Don't skip error handling** - All errors should be typed
5. **Don't use `any` type** - Biome will error on this
6. **Don't use `unknown` type** - Use proper Zod schemas
7. **Don't access private properties in tests** - Use dependency injection
8. **Don't use string concatenation** - Use template literals
9. **Don't forget exponential backoff** - Use 2^n for retry delays

## Development Commands

```bash
# Type check (strict mode, no any/unknown)
pnpm run typecheck

# Run tests (vitest)
pnpm run test

# Build (TypeScript compilation)
pnpm run build

# Watch mode
pnpm run dev

# Lint and format with Biome
pnpm run check:fix src/
```

## File Structure

```
src/
├── services/           # Core service classes
│   ├── auth.ts        # OAuth authentication
│   ├── auth.test.ts   # Auth tests
│   ├── channels.ts    # Channel management
│   ├── channels.test.ts
│   ├── messaging.ts   # Message operations
│   └── messaging.test.ts
├── interfaces/        # Storage interfaces
│   └── token-storage.ts
├── types/            # TypeScript types and Zod schemas
│   ├── index.ts      # Main types
│   ├── blocks.ts     # Slack Block Kit types
│   └── errors.ts     # Error types
├── utils/            # Helper functions
│   ├── validation-helpers.ts
│   └── message-formatter.ts
├── mocks/            # Testing utilities
│   └── index.ts      # Mock WebClient
└── index.ts          # Package exports
```

## Integration Checklist

When integrating this package:

- [ ] Implement `ISlackTokenStorage` for token persistence
- [ ] Implement `ISlackOAuthStateStorage` for OAuth state
- [ ] Implement `ISlackMessageTracking` if threading needed
- [ ] Set up OAuth redirect handler
- [ ] Handle error cases appropriately
- [ ] Test with real Slack workspace

## Security Considerations

- OAuth state expires after 15 minutes
- Tokens should be encrypted at rest
- Always validate channel access before sending
- No sensitive data in error messages
- HTTPS required for all OAuth flows
- Never log tokens or secrets
- Use CSRF protection via state parameter

## Recent Updates

### Type Safety Improvements
- Removed all `any` types throughout the codebase
- Replaced `unknown` types with proper Zod schemas
- Created comprehensive Slack Block Kit types
- Added discriminated unions for error handling

### Testing Improvements
- Added dependency injection for WebClient
- Moved tests alongside source files (*.test.ts)
- Created mock utilities in `src/mocks/`
- No more accessing private properties in tests

### Code Quality
- Full Biome compliance (no linting errors)
- Template literals instead of string concatenation
- Proper exponential backoff with 2^n formula
- Consistent error handling patterns