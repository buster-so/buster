# @buster/slack

Standalone Slack integration package with no external dependencies.

## Installation

```bash
pnpm add @buster/slack
```

## Features

- OAuth 2.0 authentication flow
- Channel management and messaging
- Thread support with message tracking
- Type-safe with Zod validation
- Framework-agnostic design
- Token storage interfaces for secure credential management
- Automatic retry with exponential backoff
- Comprehensive error handling

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
import { formatSimpleMessage, MessageTemplates } from '@buster/slack';

// Simple message
const message = formatSimpleMessage('Hello, Slack!');

// Deployment notification
const deploymentMessage = MessageTemplates.deployment({
  project: 'my-app',
  environment: 'production',
  version: '1.2.3',
  status: 'success',
  duration: '2m 30s',
  url: 'https://example.com/deployments/123'
});

// Alert message
const alertMessage = MessageTemplates.alert({
  title: 'High CPU Usage',
  message: 'CPU usage exceeded 90% threshold',
  severity: 'warning',
  source: 'monitoring-system',
  actions: [
    { text: 'View Dashboard', url: 'https://example.com/dashboard' }
  ]
});
```

## Development

```bash
# Type check
pnpm run typecheck

# Build
pnpm run build

# Test
pnpm run test
```