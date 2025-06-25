# @buster/slack

Standalone Slack integration package with OAuth 2.0, messaging, and channel management capabilities.

## Installation

```bash
pnpm add @buster/slack
```

## Features

- **OAuth 2.0 Authentication** - Complete OAuth flow with CSRF protection
- **Channel Management** - List, validate, join, and leave channels
- **Messaging** - Send messages with blocks, attachments, and threading support
- **Type Safety** - Full TypeScript support with no `any` types
- **Zod Validation** - Runtime validation for all inputs
- **Dependency Injection** - Easy testing with injectable WebClient
- **Framework Agnostic** - Works with any Node.js framework
- **Storage Interfaces** - Bring your own storage implementation
- **Retry Logic** - Automatic retry with exponential backoff
- **Error Handling** - Typed errors with user-friendly messages

## Usage

### OAuth Authentication

```typescript
import { SlackAuthService, ISlackTokenStorage, ISlackOAuthStateStorage } from '@buster/slack';

// Implement storage interfaces
const tokenStorage: ISlackTokenStorage = { /* your implementation */ };
const stateStorage: ISlackOAuthStateStorage = { /* your implementation */ };

const authService = new SlackAuthService(
  {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    redirectUri: 'https://your-app.com/slack/callback',
    scopes: ['channels:read', 'chat:write'],
  },
  tokenStorage,
  stateStorage
);

// Generate OAuth URL
const { authUrl, state } = await authService.generateAuthUrl({ userId: 'user-123' });

// Handle OAuth callback
const result = await authService.handleCallback(code, state, 'user-123');
```

### Channel Management

```typescript
import { SlackChannelService } from '@buster/slack';

const channelService = new SlackChannelService();

// Get available channels
const channels = await channelService.getAvailableChannels(accessToken);

// Validate channel access
const channel = await channelService.validateChannelAccess(accessToken, channelId);

// Join a channel
const { success } = await channelService.joinChannel(accessToken, channelId);

// Leave a channel
const leaveResult = await channelService.leaveChannel(accessToken, channelId);
```

### Sending Messages

```typescript
import { SlackMessagingService } from '@buster/slack';

const messagingService = new SlackMessagingService();

// Send a simple message
const result = await messagingService.sendMessage(
  accessToken,
  channelId,
  { text: 'Hello, Slack!' }
);

// Send a message with blocks
const richMessage = await messagingService.sendMessage(
  accessToken,
  channelId,
  {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Important Update*\nThis is a formatted message.',
        },
      },
    ],
  }
);

// Send with automatic retry
const retryResult = await messagingService.sendMessageWithRetry(
  accessToken,
  channelId,
  { text: 'Important notification' },
  3 // max retries
);
```

### Threading and Replies

```typescript
// Send initial message
const { messageTs } = await messagingService.sendMessage(
  accessToken,
  channelId,
  { text: 'Deployment started...' }
);

// Reply to the message
await messagingService.replyToMessage(
  accessToken,
  channelId,
  messageTs,
  { text: 'Deployment completed successfully!' }
);
```

### Message Tracking

Implement the `ISlackMessageTracking` interface to enable message tracking for threading:

```typescript
import { ISlackMessageTracking, MessageTrackingData } from '@buster/slack';

class MyMessageTracking implements ISlackMessageTracking {
  async storeMessageTracking(trackingData: MessageTrackingData): Promise<void> {
    // Store message mapping in your database
  }
  
  async getMessageTracking(internalMessageId: string): Promise<MessageTrackingData | null> {
    // Retrieve message mapping
  }
  
  // ... other methods
}
```

### Message Formatting Utilities

```typescript
import { 
  formatSimpleMessage, 
  formatBlockMessage,
  createSectionBlock,
  createActionsBlock,
  createContextBlock,
  createDividerBlock,
  MessageTemplates 
} from '@buster/slack';

// Simple message
const message = formatSimpleMessage('Hello, Slack!');

// Message with blocks
const blockMessage = formatBlockMessage([
  createSectionBlock('*Important Announcement*', { type: 'mrkdwn' }),
  createDividerBlock(),
  createContextBlock(['Posted by bot at ' + new Date().toISOString()])
]);

// Deployment notification template
const deploymentMessage = MessageTemplates.deployment({
  project: 'my-app',
  environment: 'production',
  version: '1.2.3',
  status: 'success',
  duration: '2m 30s',
  url: 'https://example.com/deployments/123'
});

// Alert message template
const alertMessage = MessageTemplates.alert({
  title: 'High CPU Usage',
  message: 'CPU usage exceeded 90% threshold',
  severity: 'warning',
  source: 'monitoring-system',
  actions: [
    { text: 'View Dashboard', url: 'https://example.com/dashboard' }
  ]
});

// Review flagging template
const reviewMessage = MessageTemplates.reviewFlag({
  reviewerName: 'Jane Doe',
  profileUrl: 'https://example.com/profile/jane',
  issueTitle: 'Data Quality Issue',
  description: 'The query returned unexpected results that may indicate a data integrity problem.'
});

// Update and delete messages
await messagingService.updateMessage(accessToken, channelId, messageTs, {
  text: 'Updated message content'
});

await messagingService.deleteMessage(accessToken, channelId, messageTs);
```

## Testing

The package includes comprehensive test coverage and supports dependency injection for easy testing:

```typescript
import { SlackMessagingService } from '@buster/slack';
import { WebClient } from '@slack/web-api';

// Create a mock WebClient for testing
const mockClient = {
  chat: {
    postMessage: jest.fn().mockResolvedValue({ ok: true, ts: '123' })
  }
} as unknown as WebClient;

// Inject the mock client
const messagingService = new SlackMessagingService(mockClient);

// Test your integration
const result = await messagingService.sendMessage(
  'test-token',
  'C123',
  { text: 'Test message' }
);
```

## Error Handling

All services provide typed errors for different scenarios:

```typescript
import { SlackIntegrationError } from '@buster/slack';

try {
  await messagingService.sendMessage(token, channelId, message);
} catch (error) {
  if (error instanceof SlackIntegrationError) {
    switch (error.code) {
      case 'INVALID_TOKEN':
        // Handle invalid token
        break;
      case 'CHANNEL_NOT_FOUND':
        // Handle channel not found
        break;
      case 'RATE_LIMITED':
        // Handle rate limiting
        break;
    }
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Type check
pnpm run typecheck

# Build
pnpm run build

# Test
pnpm run test

# Lint and format
pnpm run check:fix
```

## Integration Testing

Want to test against your real Slack workspace? It's super easy:

1. **Create a Slack app** at https://api.slack.com/apps
2. **Copy `.env.example` to `.env`**
3. **Add just 2 values:**
   - `SLACK_BOT_TOKEN` - Your bot token from OAuth & Permissions page
   - `SLACK_CHANNEL_ID` - Any channel ID (right-click channel → View details)
4. **Run the tests:**
   ```bash
   pnpm run test:integration
   ```

That's it! The integration tests will:
- ✅ Validate your bot token
- ✅ Check channel access
- ✅ Send test messages
- ✅ Test message updates
- ✅ Test threading
- ✅ List available channels
- ✅ Test OAuth flows
- ✅ Test error handling

All tests run in seconds and show clear pass/fail results. Integration tests are in `.int.test.ts` files alongside the service files.

## Architecture

This package follows a clean architecture with:

- **Services** - Core business logic (auth, channels, messaging)
- **Interfaces** - Storage contracts for tokens and state
- **Types** - TypeScript types and Zod schemas
- **Utils** - Helper functions and formatters
- **Mocks** - Testing utilities

All code is strictly typed with no `any` or `unknown` types, ensuring type safety throughout your application.