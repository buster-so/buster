# Task 2: Database Helper Functions

## Overview
Create focused, modular database helper functions in the `@buster/database` package to support the simplified analyst agent task. The primary need is message-based context loading: given a message_id, load the complete context needed for workflow execution (message → chat → user → organization → data source) with proper validation and error handling.

## Location
All helpers should be created in the `@buster/database` package, following the existing pattern in `packages/database/src/helpers/`. Split into focused, single-responsibility files for modularity and testability.

## Design Principles

### 1. Modular Architecture
- **Split by responsibility**: Each file handles one specific domain
- **Reusable functions**: Composable helpers that can be used independently
- **Clear interfaces**: Well-defined input/output contracts
- **Future-ready**: Prepared for multi-data source selection

### 2. Error Handling Strategy
- **Validation errors**: Clear messages for multiple organization/data source scenarios
- **User-friendly messages**: Easy-to-understand error descriptions
- **Future extensibility**: Error handling that supports data source selection UI

### 3. Concurrent Query Optimization
- **Promise.all usage**: Run independent queries concurrently
- **Minimize round trips**: Efficient database access patterns
- **Performance focus**: Optimized for workflow startup speed

## Required Helper Functions

### 1. Message Context Loading

#### File: `packages/database/src/helpers/messageContext.ts`

```typescript
import { db } from '../connection';
import { messages, chats, users, organizations, dataSources, usersToOrganizations } from '../schema';
import { eq, and, isNull, count } from 'drizzle-orm';

/**
 * Load message with basic context (message → chat → user)
 * First step in context chain - gets core message data
 */
export async function getMessageWithContext(messageId: string) {
  const result = await db
    .select({
      message: {
        id: messages.id,
        requestMessage: messages.requestMessage,
        chatId: messages.chatId,
        createdBy: messages.createdBy,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
      },
      chat: {
        id: chats.id,
        title: chats.title,
        organizationId: chats.organizationId,
        createdBy: chats.createdBy,
      },
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
      },
    })
    .from(messages)
    .leftJoin(chats, eq(messages.chatId, chats.id))
    .leftJoin(users, eq(chats.createdBy, users.id))
    .where(
      and(
        eq(messages.id, messageId),
        isNull(messages.deletedAt),
        isNull(chats.deletedAt)
      )
    )
    .limit(1);
  
  const row = result[0];
  if (!row) {
    throw new Error('Message not found or has been deleted');
  }
  
  if (!row.message.requestMessage) {
    throw new Error('Message is missing required prompt content');
  }
  
  if (!row.chat) {
    throw new Error('Message chat context not found');
  }
  
  if (!row.user) {
    throw new Error('Message user context not found');
  }
  
  return {
    message: row.message,
    chat: row.chat,
    user: row.user,
    // Convenient access to key IDs
    chatId: row.chat.id,
    userId: row.user.id,
    organizationId: row.chat.organizationId,
  };
}

/**
 * Get user's organization with validation
 * Validates single organization constraint and prepares for future multi-org support
 */
export async function getUserOrganization(userId: string) {
  // Get user's organizations
  const userOrgs = await db
    .select({
      organization: {
        id: organizations.id,
        name: organizations.name,
      },
      userOrg: {
        role: usersToOrganizations.role,
        status: usersToOrganizations.status,
      },
    })
    .from(usersToOrganizations)
    .leftJoin(organizations, eq(usersToOrganizations.organizationId, organizations.id))
    .where(
      and(
        eq(usersToOrganizations.userId, userId),
        isNull(usersToOrganizations.deletedAt),
        isNull(organizations.deletedAt),
        eq(usersToOrganizations.status, 'active')
      )
    );

  if (userOrgs.length === 0) {
    throw new Error('User is not associated with any active organizations');
  }

  if (userOrgs.length > 1) {
    throw new Error('Multiple organizations found for user. Multiple organization support is not available yet - please contact support if you need to work with multiple organizations.');
  }

  const userOrg = userOrgs[0];
  if (!userOrg.organization) {
    throw new Error('User organization not found');
  }

  return {
    organization: userOrg.organization,
    userRole: userOrg.userOrg.role,
  };
}

/**
 * Get organization's data source with validation  
 * Validates single data source constraint and prepares for future data source selection
 */
export async function getOrganizationDataSource(organizationId: string) {
  const orgDataSources = await db
    .select({
      id: dataSources.id,
      name: dataSources.name,
      type: dataSources.type,
      organizationId: dataSources.organizationId,
      onboardingStatus: dataSources.onboardingStatus,
    })
    .from(dataSources)
    .where(
      and(
        eq(dataSources.organizationId, organizationId),
        isNull(dataSources.deletedAt),
        eq(dataSources.onboardingStatus, 'completed')
      )
    );

  if (orgDataSources.length === 0) {
    throw new Error('No active data sources found for organization');
  }

  if (orgDataSources.length > 1) {
    throw new Error('Multiple data sources found for organization. Data source selection is not available yet - please contact support if you need to work with multiple data sources.');
  }

  return orgDataSources[0];
}

/**
 * Complete message context loading with concurrent queries
 * Orchestrates all context loading with optimal performance
 */
export async function getFullMessageContext(messageId: string) {
  // Step 1: Load basic message context
  const basicContext = await getMessageWithContext(messageId);
  
  // Step 2: Load organization and data source concurrently
  const [userOrgResult, dataSource] = await Promise.all([
    getUserOrganization(basicContext.userId),
    getOrganizationDataSource(basicContext.organizationId),
  ]);

  return {
    message: basicContext.message,
    chat: basicContext.chat,
    user: basicContext.user,
    organization: userOrgResult.organization,
    dataSource: dataSource,
    // Convenient access to key IDs and metadata
    chatId: basicContext.chatId,
    userId: basicContext.userId,
    organizationId: basicContext.organizationId,
    dataSourceId: dataSource.id,
    dataSourceSyntax: dataSource.type, // Maps to runtime context needs
    userRole: userOrgResult.userRole,
  };
}
```

### 2. Conversation History Loading

#### File: `packages/database/src/helpers/conversationHistory.ts`

```typescript
import { db } from '../connection';
import { messages } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { CoreMessage } from 'ai';

/**
 * Load conversation history for a chat using existing patterns
 * Leverages the same approach as getRawLlmMessagesByMessageId but for full chat
 */
export async function getChatConversationHistory(chatId: string): Promise<CoreMessage[]> {
  // Get all messages for the chat, ordered by creation time
  const chatMessages = await db
    .select({
      id: messages.id,
      rawLlmMessages: messages.rawLlmMessages,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        eq(messages.chatId, chatId),
        isNull(messages.deletedAt)
      )
    )
    .orderBy(messages.createdAt);
  
  // Combine all rawLlmMessages into a single conversation history
  const conversationHistory: CoreMessage[] = [];
  
  for (const message of chatMessages) {
    if (message.rawLlmMessages && Array.isArray(message.rawLlmMessages)) {
      // Type assertion since we know the structure from the existing codebase
      conversationHistory.push(...(message.rawLlmMessages as CoreMessage[]));
    }
  }
  
  return conversationHistory;
}

/**
 * Get conversation history from a specific message ID
 * Wrapper around existing getRawLlmMessagesByMessageId for consistency
 */
export async function getMessageConversationHistory(messageId: string): Promise<CoreMessage[] | null> {
  const messageData = await db
    .select({
      rawLlmMessages: messages.rawLlmMessages,
    })
    .from(messages)
    .where(
      and(
        eq(messages.id, messageId),
        isNull(messages.deletedAt)
      )
    )
    .limit(1);

  const message = messageData[0];
  if (!message || !message.rawLlmMessages) {
    return null;
  }

  return message.rawLlmMessages as CoreMessage[];
}
```

### 3. Helper Exports and Package Integration

#### File: `packages/database/src/helpers/index.ts`

```typescript
// Message context loading - split by responsibility
export {
  getMessageWithContext,
  getUserOrganization,
  getOrganizationDataSource,
  getFullMessageContext,
} from './messageContext';

// Conversation history loading
export {
  getChatConversationHistory,
  getMessageConversationHistory,
} from './conversationHistory';
```

#### Update: `packages/database/src/index.ts`

```typescript
// Existing exports...
export * from './connection';
export * from './schema';

// Add helper exports
export * from './helpers';
```

## Function Architecture

### Core Operations with Modular Design
- **getMessageWithContext**: Load basic message → chat → user context
- **getUserOrganization**: Validate single organization constraint with future multi-org preparation  
- **getOrganizationDataSource**: Validate single data source constraint with future selection preparation
- **getFullMessageContext**: Orchestrate all context loading with concurrent queries
- **getChatConversationHistory**: Load complete chat history using existing patterns
- **getMessageConversationHistory**: Get history from specific message (consistency wrapper)

### Design Principles
- **Modular Functions**: Each function has single responsibility and clear purpose
- **Concurrent Optimization**: Use Promise.all for independent database queries
- **Future-Ready Architecture**: Prepared for data source selection without breaking changes
- **Error Validation**: Clear constraint validation with user-friendly messages
- **Type Safety**: Strongly typed return values with convenient ID access

## Error Handling Strategy

### Validation Errors with Future Support
```typescript
// Single constraint validation with clear user guidance
throw new Error('Multiple organizations found for user. Multiple organization support is not available yet - please contact support if you need to work with multiple organizations.');

throw new Error('Multiple data sources found for organization. Data source selection is not available yet - please contact support if you need to work with multiple data sources.');

// Standard context errors
throw new Error('Message not found or has been deleted');
throw new Error('Message is missing required prompt content');
throw new Error('Message chat context not found');
throw new Error('Message user context not found');
throw new Error('User is not associated with any active organizations');
throw new Error('No active data sources found for organization');
```

### Error Message Design
- **User-friendly language**: Clear, non-technical descriptions
- **Actionable guidance**: Tell users what to do (contact support)
- **Future context**: Explain that features are coming
- **Debugging support**: Help developers understand constraint violations

## Testing Strategy

### Modular Unit Tests Structure

#### File: `packages/database/tests/helpers/messageContext.test.ts`
```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '@buster/test-utils';
import { createTestChat, createTestMessage } from '@buster/test-utils';
import {
  getMessageWithContext,
  getUserOrganization,
  getOrganizationDataSource,
  getFullMessageContext,
} from '../../src/helpers/messageContext';

describe('Message Context Loading', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });
  
  afterEach(async () => {
    await cleanupTestEnvironment();
  });
  
  test('getMessageWithContext loads basic context successfully', async () => {
    const { messageId, userId, chatId, organizationId } = await createTestMessage();
    
    const context = await getMessageWithContext(messageId);
    
    expect(context.message.id).toBe(messageId);
    expect(context.chat.id).toBe(chatId);
    expect(context.user.id).toBe(userId);
    expect(context.userId).toBe(userId);
    expect(context.chatId).toBe(chatId);
    expect(context.organizationId).toBe(organizationId);
  });
  
  test('getUserOrganization returns single organization', async () => {
    const { userId, organizationId } = await createTestMessage();
    
    const result = await getUserOrganization(userId);
    
    expect(result.organization.id).toBe(organizationId);
    expect(result.userRole).toBeDefined();
  });
  
  test('getUserOrganization throws for multiple organizations', async () => {
    // Create user with multiple organizations
    const { userId } = await createTestMessage();
    // TODO: Create second organization association
    
    await expect(getUserOrganization(userId))
      .rejects.toThrow('Multiple organization support is not available yet');
  });
  
  test('getOrganizationDataSource returns single data source', async () => {
    const { organizationId } = await createTestMessage();
    
    const dataSource = await getOrganizationDataSource(organizationId);
    
    expect(dataSource.id).toBeDefined();
    expect(dataSource.type).toBeDefined();
    expect(dataSource.organizationId).toBe(organizationId);
  });
  
  test('getOrganizationDataSource throws for multiple data sources', async () => {
    const { organizationId } = await createTestMessage();
    // TODO: Create second data source
    
    await expect(getOrganizationDataSource(organizationId))
      .rejects.toThrow('Data source selection is not available yet');
  });
  
  test('getFullMessageContext loads complete context with concurrent queries', async () => {
    const { messageId, userId, chatId, organizationId } = await createTestMessage();
    
    const context = await getFullMessageContext(messageId);
    
    expect(context.message.id).toBe(messageId);
    expect(context.chat.id).toBe(chatId);
    expect(context.user.id).toBe(userId);
    expect(context.organization.id).toBe(organizationId);
    expect(context.dataSource).toBeTruthy();
    expect(context.dataSourceSyntax).toBeDefined();
    expect(context.userRole).toBeDefined();
  });
  
  test('getFullMessageContext throws for non-existent message', async () => {
    await expect(getFullMessageContext('invalid-message-id'))
      .rejects.toThrow('Message not found or has been deleted');
  });
});
```

#### File: `packages/database/tests/helpers/conversationHistory.test.ts`
```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '@buster/test-utils';
import { createTestChat, createTestMessage } from '@buster/test-utils';
import {
  getChatConversationHistory,
  getMessageConversationHistory,
} from '../../src/helpers/conversationHistory';

describe('Conversation History Loading', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });
  
  afterEach(async () => {
    await cleanupTestEnvironment();
  });
  
  test('getChatConversationHistory returns ordered messages', async () => {
    const { chatId } = await createTestChat();
    // TODO: Create multiple messages with rawLlmMessages
    
    const history = await getChatConversationHistory(chatId);
    
    expect(Array.isArray(history)).toBe(true);
    // Add more specific assertions based on test data
  });
  
  test('getMessageConversationHistory returns message history', async () => {
    const { messageId } = await createTestMessage();
    // TODO: Ensure message has rawLlmMessages data
    
    const history = await getMessageConversationHistory(messageId);
    
    expect(history).toBeDefined();
    if (history) {
      expect(Array.isArray(history)).toBe(true);
    }
  });
  
  test('getMessageConversationHistory returns null for message without history', async () => {
    const { messageId } = await createTestMessage(); // Create without rawLlmMessages
    
    const history = await getMessageConversationHistory(messageId);
    
    expect(history).toBeNull();
  });
});
```

## Dependencies

- Existing database schema
- Drizzle ORM setup
- Database connection utilities

## Integration Points

### With Trigger Task
```typescript
// Usage in analyst-agent-task.ts
import { 
  getMessageContext,
  loadConversationHistory,
} from '@buster/database';

// Load complete context from message_id
const messageContext = await getMessageContext(payload.message_id);

// Load conversation history for the chat
const conversationHistory = await loadConversationHistory(messageContext.chat.id);
```

### With AI Workflow
```typescript
// Runtime context setup from message context
const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
runtimeContext.set('userId', messageContext.user.id);
runtimeContext.set('organizationId', messageContext.organization.id);
runtimeContext.set('dataSourceId', messageContext.dataSource.id);
runtimeContext.set('dataSourceSyntax', messageContext.dataSource.type);
runtimeContext.set('threadId', messageContext.chat.id);
```

## Deliverables

1. **Message Context Helper** (`packages/database/src/helpers/messageContext.ts`)
2. **Conversation History Helper** (`packages/database/src/helpers/conversationHistory.ts`)
3. **Helper Exports** (`packages/database/src/helpers/index.ts`)
4. **Package Integration** (Update main package exports)
5. **Unit Tests** (Focused test coverage)

## Estimated Effort

- **Implementation**: 4-6 hours
- **Testing**: 2-3 hours
- **Documentation**: 1 hour
- **Total**: 7-10 hours

## Performance Considerations

### Single Query Optimization
- Load all context in one query using joins
- Minimize database round trips
- Use appropriate indexes for message lookups

### Conversation History Loading
- Order by creation time for proper message sequencing
- Filter out deleted messages
- Handle large conversation histories efficiently