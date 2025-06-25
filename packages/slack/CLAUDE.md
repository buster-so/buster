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

2. **SlackChannelService** - Channel management
   - Lists available public channels
   - Validates channel access
   - Joins/leaves channels
   - Accepts access token as parameter

3. **SlackMessagingService** - Message operations
   - Sends messages with retry logic
   - Supports threading and replies
   - Updates and deletes messages
   - Validates messaging capability
   - Accepts access token as parameter

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

3. **Type Safety with Zod**
   - All inputs validated with Zod schemas
   - Comprehensive error types
   - No `any` types allowed

4. **Error Handling**
   - Typed error codes for different scenarios
   - Retry logic for transient failures
   - User-friendly error messages

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

- Tests are located alongside source files (not in separate folders)
- Mock the Slack WebClient for unit tests
- Test error scenarios and retry logic
- Ensure all Zod validations are covered

## Common Pitfalls to Avoid

1. **Don't store tokens internally** - Always accept as parameters
2. **Don't assume channel access** - Always validate first
3. **Don't ignore rate limits** - Use retry logic
4. **Don't skip error handling** - All errors should be typed
5. **Don't use `any` type** - Biome will error on this

## Development Commands

```bash
# Type check
pnpm run typecheck

# Run tests
pnpm run test

# Build
pnpm run build

# Watch mode
pnpm run dev
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