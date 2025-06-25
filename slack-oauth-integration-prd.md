# Slack OAuth Integration - Product Requirements Document

## Executive Summary

This document outlines the requirements for implementing Slack OAuth integration in the Buster application, enabling users to connect their Slack workspaces and utilize Slack messaging capabilities within the platform.

## Overview

### Purpose
Enable Buster users to securely authenticate with Slack workspaces, allowing the application to:
- Send messages to Slack channels
- List available channels
- Manage message threads
- Track message delivery

### Scope
- OAuth 2.0 authentication flow
- Token management and storage
- Database schema for Slack integrations
- API endpoints for OAuth flow
- Security and compliance considerations

## Technical Architecture

### Components

#### 1. **@buster/slack Package** (Existing)
- Standalone Slack integration with no database dependencies
- Provides OAuth flow management, channel operations, and messaging
- Interface-based design requiring implementation of storage interfaces

#### 2. **@apps/server** (To be implemented)
- OAuth initiation endpoint
- OAuth callback endpoint
- Integration management endpoints

#### 3. **@packages/database** (Schema additions required)
- Slack integration records
- Token storage (via Supabase Vault)
- OAuth state management

## Detailed Requirements

### OAuth Flow

#### 1. OAuth Initiation
**Endpoint:** `POST /api/v2/slack/auth/init`

**Request Body (Optional):**
```json
{
  "metadata": {
    "returnUrl": "/settings/integrations",  // Where to redirect after OAuth completes
    "source": "settings_page",              // Analytics tracking
    "projectId": "uuid"                     // Optional project context
  }
}
```

**Response:**
```json
{
  "authUrl": "https://slack.com/oauth/v2/authorize?...",
  "state": "secure-random-state"
}
```

**Metadata Explained:**
The `metadata` object is completely optional and serves to maintain context through the OAuth flow:

1. **returnUrl** - Where in your app to redirect after OAuth completes
   - Default: `/settings/integrations`
   - Example: `/projects/123/settings` to return to specific project

2. **source** - Track where user initiated OAuth from
   - Examples: `"onboarding"`, `"settings_page"`, `"project_view"`
   - Useful for analytics and user flow optimization

3. **projectId** - Associate integration with specific context
   - Optional: Since one org = one Slack integration
   - Useful if you want to track which project triggered the integration

4. **Custom fields** - Any additional context your app needs

**How it works:**
```typescript
// The metadata gets stored in the pending integration record
{
  id: "integration-id",
  oauthState: "secure-random-state",
  oauthMetadata: {
    returnUrl: "/settings/integrations",
    source: "settings_page",
    projectId: "project-123",
    // System adds:
    initiatedAt: "2024-01-01T00:00:00Z",
    ipAddress: "192.168.1.1"
  },
  status: "pending"
}

// After successful OAuth, use metadata to redirect:
const returnUrl = integration.oauthMetadata.returnUrl || '/settings';
return c.redirect(`${returnUrl}?integration=success`);
```

**Requirements:**
- Metadata is entirely optional (endpoint works without it)
- Stored in `oauth_metadata` JSONB column
- Available during callback to restore user context
- Cleared after successful OAuth
- Size limit: 1KB to prevent abuse

#### 2. OAuth Callback
**Endpoint:** `GET /api/v2/slack/auth/callback`

**Authentication:** This endpoint should be **unauthenticated** because:
- Slack redirects here directly after OAuth approval
- The user's session might have expired during the OAuth flow
- We use the `state` parameter to map back to the user/organization

**Query Parameters:**
- `code`: Authorization code from Slack
- `state`: State parameter that maps to our pending integration

**Flow:**
1. Look up pending integration by `state` parameter
2. Verify state hasn't expired (15-minute window)
3. Exchange code for access token with Slack
4. Update integration record with Slack workspace info
5. Store token in Supabase Vault
6. Redirect to success page (from metadata.returnUrl)

**Success Response (Redirect):**
```
302 Redirect to: /settings/integrations?status=success&workspace=Acme%20Corp
```

**Error Response (Redirect):**
```
302 Redirect to: /settings/integrations?status=error&error=access_denied
```

### Database Schema (Drizzle)

Add the following to `@packages/database/src/schema.ts`:

```typescript
// Enum for Slack integration status
export const slackIntegrationStatusEnum = pgEnum('slack_integration_status_enum', [
  'pending',
  'active',
  'failed',
  'revoked'
]);

// Slack integrations table
export const slackIntegrations = pgTable(
  'slack_integrations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organizationId: uuid('organization_id').notNull(),
    userId: uuid('user_id').notNull(),
    
    // OAuth state fields (for pending integrations)
    oauthState: varchar('oauth_state', { length: 255 }).unique(),
    oauthExpiresAt: timestamp('oauth_expires_at', { withTimezone: true, mode: 'string' }),
    oauthMetadata: jsonb('oauth_metadata').default({}),
    
    // Slack workspace info (populated after successful OAuth)
    teamId: varchar('team_id', { length: 255 }),
    teamName: varchar('team_name', { length: 255 }),
    teamDomain: varchar('team_domain', { length: 255 }),
    enterpriseId: varchar('enterprise_id', { length: 255 }),
    
    // Bot info
    botUserId: varchar('bot_user_id', { length: 255 }),
    scope: text(),
    
    // Token reference (actual token in Supabase Vault)
    tokenVaultKey: varchar('token_vault_key', { length: 255 }).unique(),
    
    // Metadata
    installedBySlackUserId: varchar('installed_by_slack_user_id', { length: 255 }),
    installedAt: timestamp('installed_at', { withTimezone: true, mode: 'string' }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'string' }),
    status: slackIntegrationStatusEnum().default('pending').notNull(),
    
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'slack_integrations_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'slack_integrations_user_id_fkey',
    }),
    unique('slack_integrations_org_team_key').on(table.organizationId, table.teamId),
    index('idx_slack_integrations_org_id').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_slack_integrations_team_id').using(
      'btree',
      table.teamId.asc().nullsLast().op('text_ops')
    ),
    index('idx_slack_integrations_oauth_state').using(
      'btree',
      table.oauthState.asc().nullsLast().op('text_ops')
    ),
    index('idx_slack_integrations_oauth_expires').using(
      'btree',
      table.oauthExpiresAt.asc().nullsLast().op('timestamptz_ops')
    ),
    check(
      'slack_integrations_status_check',
      sql`(status = 'pending' AND oauth_state IS NOT NULL) OR (status != 'pending' AND team_id IS NOT NULL)`
    ),
  ]
);

// Slack message tracking table (optional)
export const slackMessageTracking = pgTable(
  'slack_message_tracking',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    integrationId: uuid('integration_id').notNull(),
    
    // Internal reference
    internalMessageId: uuid('internal_message_id').notNull().unique(),
    
    // Slack references
    slackChannelId: varchar('slack_channel_id', { length: 255 }).notNull(),
    slackMessageTs: varchar('slack_message_ts', { length: 255 }).notNull(),
    slackThreadTs: varchar('slack_thread_ts', { length: 255 }),
    
    // Metadata
    messageType: varchar('message_type', { length: 50 }).notNull(), // 'message', 'reply', 'update'
    content: text(),
    senderInfo: jsonb('sender_info'),
    
    // Timestamps
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.integrationId],
      foreignColumns: [slackIntegrations.id],
      name: 'slack_message_tracking_integration_id_fkey',
    }).onDelete('cascade'),
    index('idx_message_tracking_integration').using(
      'btree',
      table.integrationId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_message_tracking_channel').using(
      'btree',
      table.slackChannelId.asc().nullsLast().op('text_ops')
    ),
    index('idx_message_tracking_thread').using(
      'btree',
      table.slackThreadTs.asc().nullsLast().op('text_ops')
    ),
  ]
);
```

### API Implementation Structure

#### File Organization

```
@apps/server/src/api/v2/slack/
├── index.ts                          # Route definitions
├── index.test.ts                     # Route tests
├── handler.ts                        # Request handlers
├── handler.test.ts                   # Unit tests
├── handler.integration.test.ts       # Integration tests
└── services/                         # Business logic
    ├── slack-oauth-service.ts        # OAuth flow logic
    ├── slack-oauth-service.test.ts   # Service unit tests
    ├── slack-helpers.ts              # Utility functions
    └── slack-helpers.test.ts         # Helper tests
```

#### API Endpoints

Since each organization will only have one Slack integration, we need just these endpoints:

**1. Initiate OAuth Flow**
`POST /api/v2/slack/auth`
- Creates pending integration record
- Generates OAuth URL with state

**2. OAuth Callback**
`GET /api/v2/slack/auth/callback`
- Handles redirect from Slack
- Exchanges code for token
- Updates integration to active

**3. Get Current Integration**
`GET /api/v2/slack/integration`
- Returns current integration status
- Returns null if no integration exists

**4. Remove Integration**
`DELETE /api/v2/slack/integration`
- Revokes token from Supabase Vault
- Soft deletes integration record

#### File Responsibilities & Separation of Concerns

**index.ts** - Pure routing, no business logic
```typescript
// ONLY route definitions and middleware
const app = new Hono()
  .post('/auth', authMiddleware, handler.initiateOAuth)
  .get('/auth/callback', handler.handleOAuthCallback)
  .get('/integration', authMiddleware, handler.getIntegration)
  .delete('/integration', authMiddleware, handler.removeIntegration);

export default app;
```

**handler.ts** - Thin HTTP layer, delegates to services
```typescript
// Each handler is a thin wrapper that:
// 1. Extracts and validates input
// 2. Calls the appropriate service function
// 3. Formats the response

export const initiateOAuth = async (c: Context) => {
  const { organizationId, userId } = c.get('auth');
  
  // Delegate to service - handler doesn't contain business logic
  const result = await slackOAuthService.initiateOAuth({
    organizationId,
    userId,
  });
  
  return c.json(result);
};
```

**services/slack-oauth-service.ts** - Business logic in pure, testable functions
```typescript
// Pure functions that can be tested independently
export async function initiateOAuth(params: {
  organizationId: string;
  userId: string;
}): Promise<{ authUrl: string; state: string }> {
  // Check for existing integration
  const existing = await slackHelpers.getActiveIntegration(params.organizationId);
  if (existing) {
    throw new Error('Integration already exists');
  }
  
  // Generate OAuth URL
  const { authUrl, state } = await generateOAuthUrl(params);
  
  // Store pending integration
  await slackHelpers.createPendingIntegration({
    ...params,
    oauthState: state,
  });
  
  return { authUrl, state };
}

// Each function does ONE thing and is independently testable
export async function generateOAuthUrl(params: {
  organizationId: string;
  userId: string;
}): Promise<{ authUrl: string; state: string }> {
  // Pure OAuth URL generation logic
}

export async function exchangeCodeForToken(params: {
  code: string;
  state: string;
}): Promise<SlackTokenResponse> {
  // Pure token exchange logic
}
```

**services/slack-helpers.ts** - Database operations as pure functions
```typescript
// Each helper is a focused, testable function
export async function getActiveIntegration(
  organizationId: string
): Promise<SlackIntegration | null> {
  return db
    .select()
    .from(slackIntegrations)
    .where(and(
      eq(slackIntegrations.organizationId, organizationId),
      eq(slackIntegrations.status, 'active'),
      isNull(slackIntegrations.deletedAt)
    ))
    .limit(1)
    .then(rows => rows[0] || null);
}

export async function createPendingIntegration(params: {
  organizationId: string;
  userId: string;
  oauthState: string;
}): Promise<string> {
  const [integration] = await db
    .insert(slackIntegrations)
    .values({
      ...params,
      status: 'pending',
      oauthExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })
    .returning({ id: slackIntegrations.id });
    
  return integration.id;
}

export async function storeTokenInVault(
  integrationId: string,
  token: string
): Promise<string> {
  // Pure function for vault storage
  const vaultKey = `slack-token-${integrationId}`;
  await supabaseVault.store(vaultKey, token);
  return vaultKey;
}
```

#### Key Design Principles

1. **Single Responsibility** - Each function does ONE thing
2. **Pure Functions** - Functions return values based on inputs, minimal side effects
3. **Dependency Injection** - Pass dependencies as parameters for easy mocking
4. **No Business Logic in Handlers** - Handlers only handle HTTP concerns
5. **Testable in Isolation** - Each function can be unit tested independently

#### Testing Structure

**Unit Tests (*.test.ts)**
- Mock external dependencies
- Test individual functions in isolation
- Focus on business logic correctness
- Mock database and Slack API calls

**Integration Tests (*.integration.test.ts)**
- Use test database
- Test full request/response cycle
- Mock only external APIs (Slack)
- Verify database state changes

**Test Utilities**
- Shared test factories for creating test data
- Mock implementations of interfaces
- Test database setup/teardown helpers

### Security Requirements

#### Token Storage
- Access tokens stored in Supabase Vault
- Vault key stored in database, not the token itself
- Tokens encrypted at rest
- Support for token rotation

#### Access Control
- Integration scoped to organization
- User must have appropriate permissions
- Audit logging for all OAuth operations
- Rate limiting on OAuth endpoints

#### OAuth Security
- State parameter validation with 15-minute expiry
- HTTPS required for all OAuth endpoints
- Redirect URI whitelist validation
- PKCE support for enhanced security (future)

### Implementation Interfaces

#### ISlackTokenStorage Implementation
```typescript
class DatabaseTokenStorage implements ISlackTokenStorage {
  async storeToken(key: string, token: string): Promise<void> {
    // Store in Supabase Vault
    // Update slack_integrations.token_vault_key
  }
  
  async getToken(key: string): Promise<string | null> {
    // Retrieve from Supabase Vault
  }
  
  async deleteToken(key: string): Promise<void> {
    // Remove from Vault
    // Clear slack_integrations.token_vault_key
  }
  
  async hasToken(key: string): Promise<boolean> {
    // Check if token exists in Vault
  }
}
```

#### ISlackOAuthStateStorage Implementation
```typescript
class DatabaseOAuthStateStorage implements ISlackOAuthStateStorage {
  async storeState(state: string, data: SlackOAuthStateData): Promise<void> {
    // Create a pending integration record with OAuth state
    await db.insert(slackIntegrations).values({
      userId: data.metadata.userId,
      organizationId: data.metadata.organizationId,
      oauth_state: state,
      oauth_expires_at: new Date(data.expiresAt),
      oauth_metadata: data.metadata,
      status: 'pending'
    });
  }
  
  async getState(state: string): Promise<SlackOAuthStateData | null> {
    // Query slack_integrations for pending OAuth
    const integration = await db
      .select()
      .from(slackIntegrations)
      .where(and(
        eq(slackIntegrations.oauth_state, state),
        eq(slackIntegrations.status, 'pending'),
        gt(slackIntegrations.oauth_expires_at, new Date())
      ))
      .limit(1);
      
    if (!integration[0]) return null;
    
    return {
      expiresAt: integration[0].oauth_expires_at.getTime(),
      metadata: integration[0].oauth_metadata
    };
  }
  
  async deleteState(state: string): Promise<void> {
    // Clean up failed/expired OAuth attempts
    await db
      .delete(slackIntegrations)
      .where(and(
        eq(slackIntegrations.oauth_state, state),
        eq(slackIntegrations.status, 'pending')
      ));
  }
}
```

### Slack App Configuration

#### Required OAuth Scopes
- `channels:read` - List channels in workspace
- `chat:write` - Send messages as bot
- `chat:write.public` - Send to channels bot hasn't joined
- `channels:join` - Join public channels
- `users:read` - Read user information

#### OAuth Redirect URLs
- Development: `http://localhost:3000/api/v2/slack/auth/callback`
- Staging: `https://staging.buster.so/api/v2/slack/auth/callback`
- Production: `https://app.buster.so/api/v2/slack/auth/callback`

### Error Handling

#### OAuth Errors
- `OAUTH_ACCESS_DENIED` - User denied authorization
- `OAUTH_INVALID_STATE` - Invalid or expired state
- `OAUTH_TOKEN_EXCHANGE_FAILED` - Failed to exchange code
- `INVALID_SCOPE` - Required scopes not granted
- `WORKSPACE_LIMIT_REACHED` - Organization workspace limit

#### Integration Errors
- `INTEGRATION_NOT_FOUND` - Integration doesn't exist
- `INTEGRATION_INACTIVE` - Integration has been deactivated
- `INVALID_CHANNEL` - Channel not accessible
- `RATE_LIMITED` - Slack API rate limit

### Monitoring & Analytics

#### Metrics to Track
- OAuth flow completion rate
- Time to complete OAuth flow
- Integration usage by organization
- Message send success rate
- Channel access patterns
- Error rates by type

#### Audit Events
- OAuth flow initiated
- OAuth flow completed/failed
- Integration created/deleted
- Token refreshed
- Message sent/failed
- Permission changes

### User Experience

#### Integration Flow
1. User navigates to Integrations page
2. Clicks "Connect Slack"
3. Redirected to Slack OAuth page
4. Approves permissions
5. Redirected back to Buster
6. See success message with workspace info
7. Can immediately start using integration

#### Management Interface
- List all connected workspaces
- Show connection status
- Last used timestamp
- Quick actions (test, disconnect)
- Channel browser
- Message history viewer

### Future Enhancements

#### Phase 2
- Incoming webhooks support
- Event subscriptions (message reactions, new messages)
- Slash commands
- Interactive components (buttons, modals)
- Multiple workspace per organization

#### Phase 3
- Scheduled messages
- Message formatting builder
- Template library
- Bulk operations
- Analytics dashboard

### Testing Requirements

#### Test File Coverage

**index.test.ts**
- Route registration verification
- Middleware application checks
- Route parameter validation

**handler.test.ts** - Test HTTP layer only
```typescript
describe('SlackHandler', () => {
  // Mock the service layer
  const mockSlackOAuthService = {
    initiateOAuth: vi.fn(),
    handleCallback: vi.fn(),
    getIntegration: vi.fn(),
    removeIntegration: vi.fn(),
  };

  describe('initiateOAuth', () => {
    it('should extract auth context and call service');
    it('should return 200 with auth URL');
    it('should handle service errors appropriately');
  });
  
  describe('handleOAuthCallback', () => {
    it('should validate query parameters');
    it('should call service with code and state');
    it('should redirect on success');
    it('should handle errors with proper status codes');
  });
});
```

**services/slack-oauth-service.test.ts** - Test business logic
```typescript
describe('SlackOAuthService', () => {
  // Mock only external dependencies
  const mockSlackHelpers = {
    getActiveIntegration: vi.fn(),
    createPendingIntegration: vi.fn(),
    updateIntegrationStatus: vi.fn(),
  };

  describe('initiateOAuth', () => {
    it('should throw if integration already exists');
    it('should generate valid OAuth URL');
    it('should create pending integration with state');
    it('should set 15-minute expiry on state');
  });
  
  describe('exchangeCodeForToken', () => {
    it('should validate state exists and not expired');
    it('should call Slack API with correct parameters');
    it('should store token in vault');
    it('should update integration to active status');
    it('should clear OAuth state after success');
  });
});
```

**services/slack-helpers.test.ts** - Test data layer
```typescript
describe('SlackHelpers', () => {
  describe('getActiveIntegration', () => {
    it('should return active integration for org');
    it('should exclude deleted integrations');
    it('should return null if no integration');
  });
  
  describe('createPendingIntegration', () => {
    it('should create with pending status');
    it('should set OAuth expiry timestamp');
    it('should return integration ID');
  });
  
  describe('storeTokenInVault', () => {
    it('should generate correct vault key');
    it('should store encrypted token');
    it('should return vault key');
  });
});
```

**handler.integration.test.ts**
- Full OAuth flow with database
- State expiration handling
- Organization isolation
- Concurrent request handling

**services/slack-oauth-service.test.ts**
- OAuth URL generation
- State management
- Token exchange logic
- Vault integration mocking

**services/slack-helpers.test.ts**
- Database query functions
- Token encryption/decryption
- Status checking logic
- Data transformation utilities

#### Testing Best Practices

1. **Test Data Isolation**
   - Each test creates its own organization/user
   - Clean up after each test
   - No shared state between tests

2. **Mock Strategy**
   - Mock Slack API responses
   - Mock Supabase Vault operations
   - Use real database in integration tests
   - Mock time for expiration tests

3. **Error Scenarios**
   - Network failures
   - Invalid OAuth codes
   - Expired states
   - Rate limiting
   - Database conflicts

4. **Security Testing**
   - CSRF protection validation
   - Authorization checks
   - Token exposure prevention
   - Cross-organization access

### Development & Testing Workflow

#### Local Development Setup

1. **Environment Configuration**
```bash
# .env.local
SLACK_INTEGRATION_ENABLED=false  # Set to true when ready to test
SLACK_CLIENT_ID=your-dev-client-id
SLACK_CLIENT_SECRET=your-dev-client-secret
SLACK_REDIRECT_URI=http://localhost:3000/api/v2/slack/auth/callback
SUPABASE_VAULT_KEY=your-vault-key
```

**Feature Flag Implementation:**
```typescript
// services/slack-oauth-service.ts
export async function initiateOAuth(params: {
  organizationId: string;
  userId: string;
}): Promise<{ authUrl: string; state: string }> {
  // Check if Slack integration is enabled
  if (!process.env.SLACK_INTEGRATION_ENABLED || process.env.SLACK_INTEGRATION_ENABLED === 'false') {
    throw new Error('Slack integration is not enabled');
  }
  
  // Regular OAuth flow continues...
}
```

2. **Testing with Real Slack**

For local development, you'll need to set up a real Slack app and use ngrok to expose your localhost:

**Slack App Setup:**
1. Go to https://api.slack.com/apps and create a new app
2. Choose "From scratch" and select your workspace
3. Add OAuth scopes under "OAuth & Permissions":
   - `channels:read`
   - `chat:write`
   - `chat:write.public`
4. Add redirect URL (will update with ngrok URL)

**Local Development with ngrok:**
```bash
# Start your local server
pnpm run dev --filter=@buster-app/server

# In another terminal, expose your localhost
ngrok http 3000

# Copy the HTTPS URL from ngrok (e.g., https://abc123.ngrok.io)
# Update your Slack app's redirect URL to:
# https://abc123.ngrok.io/api/v2/slack/auth/callback

# Update your .env.local
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_REDIRECT_URI=https://abc123.ngrok.io/api/v2/slack/auth/callback
```

**Testing Flow:**
1. Start your server and ngrok
2. Navigate to your OAuth initiation endpoint
3. You'll be redirected to real Slack OAuth
4. Approve access in your test workspace
5. Slack redirects back to your ngrok URL
6. Your callback handler processes the real OAuth code

3. **Database Setup**
```bash
# Run migrations
pnpm run db:migrate

# Seed test data
pnpm run db:seed:dev
```

#### Testing Workflow

**1. Unit Tests (Fast Feedback)**
```bash
# Run all unit tests (works without Slack credentials)
pnpm run test:unit --filter=@buster-app/server

# Run specific test file
pnpm run test apps/server/src/api/v2/slack/handler.test.ts

# Watch mode for development
pnpm run test:watch apps/server/src/api/v2/slack
```

**Unit Test Mocking Strategy:**
```typescript
// handler.test.ts - Tests work without real Slack
describe('SlackHandler', () => {
  beforeEach(() => {
    // Mock environment check
    vi.stubEnv('SLACK_INTEGRATION_ENABLED', 'true');
    
    // Mock Slack API calls
    vi.mock('@buster/slack', () => ({
      SlackAuthService: vi.fn(() => ({
        generateAuthUrl: vi.fn().mockResolvedValue({
          authUrl: 'https://mock-url',
          state: 'mock-state'
        }),
        handleCallback: vi.fn().mockResolvedValue({
          teamId: 'T-MOCK',
          teamName: 'Mock Team'
        })
      }))
    }));
  });
  
  it('should handle disabled integration gracefully', async () => {
    vi.stubEnv('SLACK_INTEGRATION_ENABLED', 'false');
    
    const response = await app.request('/api/v2/slack/auth', {
      method: 'POST'
    });
    
    expect(response.status).toBe(503); // Service Unavailable
    expect(await response.json()).toEqual({
      error: 'Slack integration is not enabled'
    });
  });
});
```

**2. Integration Tests (Conditional Execution)**
```bash
# Integration tests skip Slack tests when disabled
pnpm run test:integration --filter=@buster-app/server
```

```typescript
// handler.integration.test.ts
describe('Slack OAuth Integration', () => {
  const slackEnabled = process.env.SLACK_INTEGRATION_ENABLED === 'true';
  
  describe.skipIf(!slackEnabled)('with real Slack', () => {
    // These tests only run when SLACK_INTEGRATION_ENABLED=true
    it('should complete OAuth flow', async () => {
      // Real Slack OAuth test
    });
  });
  
  describe('with mocked Slack', () => {
    // These tests always run
    it('should handle database operations', async () => {
      // Test database without real Slack
    });
  });
});
```

**3. Manual Testing Flow**
```bash
# Start server
pnpm run dev --filter=@buster-app/server

# Test OAuth flow
curl -X POST http://localhost:3000/api/v2/slack/auth \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Response includes auth URL
# Visit URL in browser to complete OAuth

# Check integration status
curl http://localhost:3000/api/v2/slack/integration \
  -H "Authorization: Bearer $TOKEN"

# Remove integration
curl -X DELETE http://localhost:3000/api/v2/slack/integration \
  -H "Authorization: Bearer $TOKEN"
```

#### Verification Checklist

**OAuth Flow Verification**
- [ ] Auth URL includes all required parameters
- [ ] State is stored in database with expiry
- [ ] Callback validates state correctly
- [ ] Token exchange succeeds
- [ ] Token stored in Supabase Vault
- [ ] Integration record updated to 'active'
- [ ] OAuth metadata cleared after success

**Security Verification**
- [ ] State expires after 15 minutes
- [ ] Invalid state returns error
- [ ] Cross-organization access blocked
- [ ] Tokens never exposed in API responses
- [ ] Deleted integrations can't be accessed

**Error Handling Verification**
- [ ] User denial handled gracefully
- [ ] Network errors return appropriate status
- [ ] Duplicate integration attempts blocked
- [ ] Missing integration returns 404

### CI/CD Considerations

#### Environment-Based Configuration

**Local Development (default):**
```env
SLACK_INTEGRATION_ENABLED=false
# Slack credentials optional
```

**CI/CD Pipeline:**
```env
SLACK_INTEGRATION_ENABLED=false
# Tests run with mocked Slack
```

**Staging:**
```env
SLACK_INTEGRATION_ENABLED=true
SLACK_CLIENT_ID=staging-client-id
SLACK_CLIENT_SECRET=xxx (from secrets)
SLACK_REDIRECT_URI=https://staging.buster.so/api/v2/slack/auth/callback
```

**Production:**
```env
SLACK_INTEGRATION_ENABLED=true
SLACK_CLIENT_ID=prod-client-id
SLACK_CLIENT_SECRET=xxx (from Supabase Vault)
SLACK_REDIRECT_URI=https://app.buster.so/api/v2/slack/auth/callback
```

#### API Response When Disabled

When `SLACK_INTEGRATION_ENABLED=false`, endpoints return:
```json
{
  "error": "Slack integration is not enabled",
  "code": "INTEGRATION_DISABLED",
  "status": 503
}
```

This allows:
- Frontend to conditionally show/hide Slack features
- Tests to run without Slack credentials
- Gradual rollout with feature flags

### Deployment Considerations

#### Environment Variables
```env
SLACK_INTEGRATION_ENABLED=true/false
SLACK_CLIENT_ID=xxx
SLACK_CLIENT_SECRET=xxx (store in Supabase Vault)
SLACK_REDIRECT_URI=https://app.buster.so/api/v2/slack/auth/callback
SLACK_OAUTH_SCOPES=channels:read,chat:write,chat:write.public
```

#### Migration Strategy
1. Deploy database schema
2. Configure Supabase Vault
3. Deploy API endpoints
4. Update Slack app configuration
5. Enable feature flag
6. Gradual rollout

### Success Criteria

1. **Security**: Zero OAuth-related security incidents
2. **Reliability**: 99.9% uptime for OAuth endpoints
3. **Performance**: OAuth flow completes in <3 seconds
4. **Adoption**: 50% of organizations connect Slack within 30 days
5. **Retention**: 90% of integrations remain active after 60 days

### Dependencies

- **@buster/slack** package (existing)
- **Supabase Vault** for token storage
- **Slack API** availability
- **Database** migrations completed
- **Frontend** integration UI

### Timeline

- **Week 1-2**: Database schema and migrations
- **Week 2-3**: OAuth endpoints implementation
- **Week 3-4**: Integration management APIs
- **Week 4-5**: Frontend integration
- **Week 5-6**: Testing and security review
- **Week 6-7**: Documentation and deployment

### Appendix

#### Slack API Reference
- [OAuth 2.0 Flow](https://api.slack.com/authentication/oauth-v2)
- [Web API Methods](https://api.slack.com/web)
- [Bot Tokens & Scopes](https://api.slack.com/authentication/token-types)

#### Internal References
- @buster/slack package documentation
- Supabase Vault documentation
- Organization permissions model