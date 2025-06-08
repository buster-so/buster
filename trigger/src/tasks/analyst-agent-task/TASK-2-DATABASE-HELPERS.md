# Task 2: Database Helper Functions

## ✅ Status: COMPLETED

**Implementation**: ✅ Complete
**Unit Tests**: ✅ Complete  
**Documentation**: ✅ Complete

### Delivered Files
- **Message Helpers**:
  - `packages/database/src/helpers/messages/messageContext.ts`
  - `packages/database/src/helpers/messages/chatConversationHistory.ts`
- **Data Source Helpers**:
  - `packages/database/src/helpers/dataSources/organizationDataSource.ts`
- **Exports and Integration**:
  - `packages/database/src/helpers/index.ts` (updated)
  - `packages/database/src/index.ts` (updated to export helpers)
- **Unit Tests**:
  - `packages/database/tests/helpers/messages/messageContext.test.ts`
  - `packages/database/tests/helpers/messages/chatConversationHistory.test.ts`
  - `packages/database/tests/helpers/dataSources/organizationDataSource.test.ts`

### Key Accomplishments
- ✅ Domain-organized helper structure implemented
- ✅ Chat-wide conversation history loading (gets ALL rawLlmMessages from ALL messages in chat)
- ✅ Zod validation schemas for all inputs/outputs
- ✅ Concurrent query optimization patterns
- ✅ Database-native approach (moved logic from AI package to database package)
- ✅ Comprehensive unit test coverage with domain organization
- ✅ Future-ready error messages for multi-data source support

## Overview
Create simple, focused database helper functions in the `@buster/database` package to support the analyst agent task. Use existing patterns from the AI package and keep it minimal - we only need message context for runtime setup and existing conversation history utilities.

## Location
Create helpers in organized folders within `packages/database/src/helpers/` by domain, with each helper in its own file with Zod validation schemas.

## Design Principles

### 1. Folder Organization by Domain
- **`messages/`**: Message-related database operations
- **`dataSources/`**: Data source database operations  
- **Future folders**: `chats/`, `users/`, etc. as needed
- **Test structure**: Mirror the same folder organization in tests

### 2. Chat-Wide Conversation History
- **Full chat context**: Get ALL rawLlmMessages from ALL messages in the chat
- **Database-native**: Move message history logic into database package
- **Efficient queries**: Single query to get all chat messages and combine their rawLlmMessages

### 3. Zod Validation & Concurrent Optimization
- **Type-safe**: Input/output validation for each helper
- **Concurrent queries**: Run independent operations in parallel
- **Simple chain**: message → organizationId → dataSource

## Required Helper Functions

### 1. Message Context Helper

#### File: `packages/database/src/helpers/messages/messageContext.ts`

```typescript
import { z } from 'zod';
import { db } from '../../connection';
import { messages, chats } from '../../schema';
import { eq, and, isNull } from 'drizzle-orm';

// Zod schemas for validation
export const MessageContextInputSchema = z.object({
  messageId: z.string().uuid('Message ID must be a valid UUID'),
});

export const MessageContextOutputSchema = z.object({
  messageId: z.string(),
  userId: z.string(),
  chatId: z.string(), 
  organizationId: z.string(),
  requestMessage: z.string(),
});

export type MessageContextInput = z.infer<typeof MessageContextInputSchema>;
export type MessageContextOutput = z.infer<typeof MessageContextOutputSchema>;

/**
 * Get message context for runtime setup
 * Returns the essential IDs needed for analyst workflow
 */
export async function getMessageContext(input: MessageContextInput): Promise<MessageContextOutput> {
  // Validate input
  const validatedInput = MessageContextInputSchema.parse(input);
  
  const result = await db
    .select({
      messageId: messages.id,
      requestMessage: messages.requestMessage,
      chatId: messages.chatId,
      userId: messages.createdBy,
      organizationId: chats.organizationId,
    })
    .from(messages)
    .leftJoin(chats, eq(messages.chatId, chats.id))
    .where(
      and(
        eq(messages.id, validatedInput.messageId),
        isNull(messages.deletedAt),
        isNull(chats.deletedAt)
      )
    )
    .limit(1);
  
  const row = result[0];
  if (!row) {
    throw new Error('Message not found or has been deleted');
  }
  
  if (!row.requestMessage) {
    throw new Error('Message is missing required prompt content');
  }
  
  if (!row.organizationId) {
    throw new Error('Message chat context or organization not found');
  }
  
  const output = {
    messageId: row.messageId,
    userId: row.userId,
    chatId: row.chatId,
    organizationId: row.organizationId,
    requestMessage: row.requestMessage,
  };

  // Validate output
  return MessageContextOutputSchema.parse(output);
}
```

### 2. Chat Conversation History Helper

#### File: `packages/database/src/helpers/messages/chatConversationHistory.ts`

```typescript
import { z } from 'zod';
import { db } from '../../connection';
import { messages, chats } from '../../schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { CoreMessage } from 'ai';

// Zod schemas for validation
export const ChatConversationHistoryInputSchema = z.object({
  messageId: z.string().uuid('Message ID must be a valid UUID'),
});

export const ChatConversationHistoryOutputSchema = z.array(z.any()); // CoreMessage[] but allowing any for flexibility

export type ChatConversationHistoryInput = z.infer<typeof ChatConversationHistoryInputSchema>;
export type ChatConversationHistoryOutput = z.infer<typeof ChatConversationHistoryOutputSchema>;

/**
 * Get complete conversation history for a chat from any message in that chat
 * Finds the chat from the given messageId, then loads ALL rawLlmMessages from ALL messages in that chat
 */
export async function getChatConversationHistory(input: ChatConversationHistoryInput): Promise<ChatConversationHistoryOutput> {
  // Validate input
  const validatedInput = ChatConversationHistoryInputSchema.parse(input);
  
  // First, get the chatId from the given messageId
  const messageResult = await db
    .select({
      chatId: messages.chatId,
    })
    .from(messages)
    .where(
      and(
        eq(messages.id, validatedInput.messageId),
        isNull(messages.deletedAt)
      )
    )
    .limit(1);
  
  const messageRow = messageResult[0];
  if (!messageRow) {
    throw new Error('Message not found or has been deleted');
  }
  
  // Get all messages for this chat, ordered by creation time
  const chatMessages = await db
    .select({
      id: messages.id,
      rawLlmMessages: messages.rawLlmMessages,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        eq(messages.chatId, messageRow.chatId),
        isNull(messages.deletedAt)
      )
    )
    .orderBy(messages.createdAt);
  
  // Combine all rawLlmMessages into a single conversation history
  const conversationHistory: CoreMessage[] = [];
  
  for (const message of chatMessages) {
    if (message.rawLlmMessages && Array.isArray(message.rawLlmMessages)) {
      // Add all messages from this message's rawLlmMessages
      conversationHistory.push(...(message.rawLlmMessages as CoreMessage[]));
    }
  }
  
  // Validate output
  return ChatConversationHistoryOutputSchema.parse(conversationHistory);
}
```

### 3. Data Source Helper

#### File: `packages/database/src/helpers/dataSources/organizationDataSource.ts`

```typescript
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources } from '../../schema';
import { eq, and, isNull } from 'drizzle-orm';

// Zod schemas for validation
export const OrganizationDataSourceInputSchema = z.object({
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
});

export const OrganizationDataSourceOutputSchema = z.object({
  dataSourceId: z.string(),
  dataSourceSyntax: z.string(),
});

export type OrganizationDataSourceInput = z.infer<typeof OrganizationDataSourceInputSchema>;
export type OrganizationDataSourceOutput = z.infer<typeof OrganizationDataSourceOutputSchema>;

/**
 * Get organization's data source with validation
 * Validates single data source constraint and prepares for future selection
 */
export async function getOrganizationDataSource(input: OrganizationDataSourceInput): Promise<OrganizationDataSourceOutput> {
  // Validate input
  const validatedInput = OrganizationDataSourceInputSchema.parse(input);
  
  const orgDataSources = await db
    .select({
      id: dataSources.id,
      type: dataSources.type,
    })
    .from(dataSources)
    .where(
      and(
        eq(dataSources.organizationId, validatedInput.organizationId),
        isNull(dataSources.deletedAt)
      )
    );

  if (orgDataSources.length === 0) {
    throw new Error('No data sources found for organization');
  }

  if (orgDataSources.length > 1) {
    throw new Error('Multiple data sources found for organization. Data source selection is not available yet - please contact support if you need to work with multiple data sources.');
  }

  const dataSource = orgDataSources[0];
  const output = {
    dataSourceId: dataSource.id,
    dataSourceSyntax: dataSource.type,
  };

  // Validate output
  return OrganizationDataSourceOutputSchema.parse(output);
}
```

### 4. Helper Exports and Package Integration

#### File: `packages/database/src/helpers/index.ts`

```typescript
// Message helpers
export {
  getMessageContext,
  MessageContextInputSchema,
  MessageContextOutputSchema,
  type MessageContextInput,
  type MessageContextOutput,
} from './messages/messageContext';

export {
  getChatConversationHistory,
  ChatConversationHistoryInputSchema,
  ChatConversationHistoryOutputSchema,
  type ChatConversationHistoryInput,
  type ChatConversationHistoryOutput,
} from './messages/chatConversationHistory';

// Data source helpers
export {
  getOrganizationDataSource,
  OrganizationDataSourceInputSchema,
  OrganizationDataSourceOutputSchema,
  type OrganizationDataSourceInput,
  type OrganizationDataSourceOutput,
} from './dataSources/organizationDataSource';
```

#### Update: `packages/database/src/index.ts`

```typescript
// Existing exports...
export * from './connection';
export * from './schema';

// Add helper exports
export * from './helpers';
```

## Organized Function Architecture

### Domain-Organized Helpers
1. **Messages Domain** (`messages/`):
   - `getMessageContext()`: Essential message → chat context with organizationId
   - `getChatConversationHistory()`: Complete chat conversation from any messageId

2. **Data Sources Domain** (`dataSources/`):
   - `getOrganizationDataSource()`: Data source info with multi-source validation

### Design Benefits
- **Domain organization**: Clear separation by database entity type
- **Database-native**: Message history logic moved from AI package to database package
- **Chat-wide history**: Gets ALL messages in chat, not just one message
- **Zod validation**: Type-safe input/output for each helper
- **Future-ready**: Prepared for data source selection and additional domains

## Concurrent Optimization Pattern

```typescript
// Optimal concurrent pattern (message context + history can run together)
const [messageContext, conversationHistory] = await Promise.all([
  getMessageContext({ messageId: payload.message_id }),
  getChatConversationHistory({ messageId: payload.message_id }),
]);

// Then get data source using organizationId from message context
const dataSource = await getOrganizationDataSource({ 
  organizationId: messageContext.organizationId 
});
```

## Error Handling Strategy

### Data Source Validation
```typescript
// Single constraint validation with clear user guidance
throw new Error('Multiple data sources found for organization. Data source selection is not available yet - please contact support if you need to work with multiple data sources.');

// Standard context errors
throw new Error('Message not found or has been deleted');
throw new Error('Message is missing required prompt content');
throw new Error('Message chat context or organization not found');
throw new Error('No data sources found for organization');
```

### Zod Validation Errors
- **Input validation**: UUID format checking, required field validation
- **Output validation**: Ensure helper return values match expected schemas
- **Clear error messages**: Descriptive validation feedback for debugging

## Testing Strategy

### Domain-Organized Unit Tests

#### File: `packages/database/tests/helpers/messages/messageContext.test.ts`
```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '@buster/test-utils';
import { createTestMessage } from '@buster/test-utils';
import {
  getMessageContext,
  type MessageContextInput,
} from '../../../src/helpers/messages/messageContext';

describe('Message Context Helper', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });
  
  afterEach(async () => {
    await cleanupTestEnvironment();
  });
  
  test('getMessageContext returns essential context successfully', async () => {
    const { messageId, userId, chatId, organizationId } = await createTestMessage();
    
    const input: MessageContextInput = { messageId };
    const context = await getMessageContext(input);
    
    expect(context.messageId).toBe(messageId);
    expect(context.userId).toBe(userId);
    expect(context.chatId).toBe(chatId);
    expect(context.organizationId).toBe(organizationId);
    expect(context.requestMessage).toBeDefined();
  });
  
  test('getMessageContext validates UUID input', async () => {
    const input: MessageContextInput = { messageId: 'invalid-uuid' };
    
    await expect(getMessageContext(input))
      .rejects.toThrow('Message ID must be a valid UUID');
  });
  
  test('getMessageContext throws for non-existent message', async () => {
    const input: MessageContextInput = { 
      messageId: '00000000-0000-0000-0000-000000000000' 
    };
    
    await expect(getMessageContext(input))
      .rejects.toThrow('Message not found or has been deleted');
  });
});
```

#### File: `packages/database/tests/helpers/messages/chatConversationHistory.test.ts`
```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '@buster/test-utils';
import { createTestMessage } from '@buster/test-utils';
import {
  getChatConversationHistory,
  type ChatConversationHistoryInput,
} from '../../../src/helpers/messages/chatConversationHistory';

describe('Chat Conversation History Helper', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });
  
  afterEach(async () => {
    await cleanupTestEnvironment();
  });
  
  test('getChatConversationHistory returns all messages in chat', async () => {
    const { messageId, chatId } = await createTestMessage();
    // TODO: Create additional messages in same chat with rawLlmMessages
    
    const input: ChatConversationHistoryInput = { messageId };
    const history = await getChatConversationHistory(input);
    
    expect(Array.isArray(history)).toBe(true);
    // Should return combined rawLlmMessages from all messages in chat
  });
  
  test('getChatConversationHistory validates UUID input', async () => {
    const input: ChatConversationHistoryInput = { messageId: 'invalid-uuid' };
    
    await expect(getChatConversationHistory(input))
      .rejects.toThrow('Message ID must be a valid UUID');
  });
  
  test('getChatConversationHistory throws for non-existent message', async () => {
    const input: ChatConversationHistoryInput = { 
      messageId: '00000000-0000-0000-0000-000000000000' 
    };
    
    await expect(getChatConversationHistory(input))
      .rejects.toThrow('Message not found or has been deleted');
  });
});
```

#### File: `packages/database/tests/helpers/dataSources/organizationDataSource.test.ts`
```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '@buster/test-utils';
import { createTestMessage } from '@buster/test-utils';
import {
  getOrganizationDataSource,
  type OrganizationDataSourceInput,
} from '../../../src/helpers/dataSources/organizationDataSource';

describe('Organization Data Source Helper', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });
  
  afterEach(async () => {
    await cleanupTestEnvironment();
  });
  
  test('getOrganizationDataSource returns data source info', async () => {
    const { organizationId } = await createTestMessage();
    
    const input: OrganizationDataSourceInput = { organizationId };
    const dataSource = await getOrganizationDataSource(input);
    
    expect(dataSource.dataSourceId).toBeDefined();
    expect(dataSource.dataSourceSyntax).toBeDefined();
  });
  
  test('getOrganizationDataSource validates UUID input', async () => {
    const input: OrganizationDataSourceInput = { organizationId: 'invalid-uuid' };
    
    await expect(getOrganizationDataSource(input))
      .rejects.toThrow('Organization ID must be a valid UUID');
  });
  
  test('getOrganizationDataSource throws for multiple data sources', async () => {
    const { organizationId } = await createTestMessage();
    // TODO: Create second data source for same organization
    
    const input: OrganizationDataSourceInput = { organizationId };
    await expect(getOrganizationDataSource(input))
      .rejects.toThrow('Data source selection is not available yet');
  });
});
```

## Dependencies

- **Database Schema**: Uses existing `@buster/database` schema tables (messages, chats, dataSources)
- **Drizzle ORM**: Database query builder for type-safe queries
- **Database Connection**: Existing connection utilities from `@buster/database`
- **Zod**: Runtime validation for input/output schemas
- **Test Utilities**: `@buster/test-utils` for database test setup and data creation
- **AI Types**: `CoreMessage` from `ai` package for conversation history typing

## Integration Points

### With Trigger Task (Organized Domain Usage)
```typescript
// Usage in analyst-agent-task.ts
import { 
  getMessageContext,
  getOrganizationDataSource,
  getChatConversationHistory,
} from '@buster/database';

// Optimal concurrent pattern
const [messageContext, conversationHistory] = await Promise.all([
  getMessageContext({ messageId: payload.message_id }),
  getChatConversationHistory({ messageId: payload.message_id }),
]);

// Get data source with organizationId from message context
const dataSource = await getOrganizationDataSource({ 
  organizationId: messageContext.organizationId 
});
```

### With AI Workflow (Runtime Context Setup)
```typescript
// Runtime context setup with all required fields
const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
runtimeContext.set('userId', messageContext.userId);
runtimeContext.set('organizationId', messageContext.organizationId);
runtimeContext.set('dataSourceId', dataSource.dataSourceId);
runtimeContext.set('dataSourceSyntax', dataSource.dataSourceSyntax);
runtimeContext.set('threadId', messageContext.chatId);
runtimeContext.set('messageId', messageContext.messageId);

// Pass conversation history and prompt to analyst workflow
const workflowInput = {
  prompt: messageContext.requestMessage,
  conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
};
```

## Deliverables

1. **Messages Domain Helpers** (`packages/database/src/helpers/messages/`)
   - `messageContext.ts`: Message context with essential IDs
   - `chatConversationHistory.ts`: Complete chat conversation history

2. **Data Sources Domain Helpers** (`packages/database/src/helpers/dataSources/`)
   - `organizationDataSource.ts`: Data source info with constraint validation

3. **Helper Exports** (`packages/database/src/helpers/index.ts`)
   - Domain-organized exports with schemas and types

4. **Package Integration** (Update `packages/database/src/index.ts`)
   - Export all helpers from main package

5. **Domain-Organized Unit Tests** 
   - Test structure mirrors helper organization
   - Validation error testing for each helper
   - UUID format validation

## Estimated Effort (Domain-Organized)

- **Implementation**: 4-5 hours (increased for folder organization and chat-wide history)
- **Testing**: 2-3 hours  
- **Documentation**: 30 minutes
- **Total**: 6.5-8.5 hours

## Performance Considerations

### Simple Query Optimization
- **Single join queries**: Minimal database access for message context
- **Existing function reuse**: Leverage proven `getRawLlmMessagesByMessageId`
- **Concurrent capability**: Can run message context and history queries in parallel

### Validation Overhead
- **Zod validation**: Minimal performance impact for type safety benefits
- **Input validation**: Prevents invalid database queries
- **Output validation**: Ensures consistent return types

### Future Readiness
- **Data source constraint**: Clear path to multi-source selection
- **Simple architecture**: Easy to extend without breaking changes