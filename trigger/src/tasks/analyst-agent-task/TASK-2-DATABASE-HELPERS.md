# Task 2: Database Helper Functions

## Overview
Create focused database helper functions in the `@buster/database` package to support the simplified analyst agent task. The primary need is message-based context loading: given a message_id, load the complete context needed for workflow execution (message → chat → user → organization → data source).

## Location
All helpers should be created in the `@buster/database` package, following the existing pattern in `packages/database/src/helpers/`.

## Required Helper Functions

### 1. Core Message Context Loading

#### File: `packages/database/src/helpers/messageContext.ts`

```typescript
import { db } from '../connection';
import { messages, chats, users, organizations, dataSources } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Load complete context from message_id for workflow execution
 * Returns all the data needed to run the analyst workflow
 */
export async function getMessageContext(messageId: string) {
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
      organization: {
        id: organizations.id,
        name: organizations.name,
      },
      dataSource: {
        id: dataSources.id,
        type: dataSources.type,
        organizationId: dataSources.organizationId,
      },
    })
    .from(messages)
    .leftJoin(chats, eq(messages.chatId, chats.id))
    .leftJoin(users, eq(chats.createdBy, users.id))
    .leftJoin(organizations, eq(chats.organizationId, organizations.id))
    .leftJoin(dataSources, eq(organizations.id, dataSources.organizationId))
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
  
  if (!row.organization) {
    throw new Error('User organization context not found');
  }
  
  if (!row.dataSource) {
    throw new Error('Organization data source not found');
  }
  
  return {
    message: row.message,
    chat: row.chat,
    user: row.user,
    organization: row.organization,
    dataSource: row.dataSource,
  };
}
```

### 2. Conversation History Loading

#### File: `packages/database/src/helpers/conversationHistory.ts`

```typescript
import { db } from '../connection';
import { messages } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Load conversation history for a chat (for the analyst workflow)
 * Uses existing utilities from AI package for proper formatting
 */
export async function loadConversationHistory(chatId: string) {
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
  const conversationHistory: any[] = []; // CoreMessage[]
  
  for (const message of chatMessages) {
    if (message.rawLlmMessages && Array.isArray(message.rawLlmMessages)) {
      conversationHistory.push(...message.rawLlmMessages);
    }
  }
  
  return conversationHistory;
}
```

### 3. Helper Exports

#### File: `packages/database/src/helpers/index.ts`

```typescript
// Message context loading
export {
  getMessageContext,
} from './messageContext';

// Conversation history
export {
  loadConversationHistory,
} from './conversationHistory';
```

### 4. Main Package Export

#### File: `packages/database/src/index.ts`

```typescript
// Existing exports...
export * from './connection';
export * from './schema';

// Add helper exports
export * from './helpers';
```

## Simplified Helper Functions

### Core Operations
- **Message Context Loading**: Single function to load complete context from message_id
- **Conversation History**: Load chat history for workflow input
- **Minimal Surface Area**: Only what's needed for the simplified task

### Design Principles
- **Single Query Approach**: Load all context in one database query where possible
- **Error Handling**: Clear error messages for missing context
- **Type Safety**: Strongly typed return values for workflow integration

## Error Handling

### Context Loading Errors
```typescript
// Message not found
throw new Error('Message not found or has been deleted');

// Missing required context
throw new Error('Message is missing required prompt content');
throw new Error('Message chat context not found');
throw new Error('Message user context not found');
throw new Error('User organization context not found');
throw new Error('Organization data source not found');
```

## Testing Strategy

### Unit Tests Structure
```typescript
// tests/helpers/messageContext.test.ts
describe('Message Context Loading', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });
  
  afterEach(async () => {
    await cleanupTestDatabase();
  });
  
  test('getMessageContext loads complete context', async () => {
    const { messageId, userId, chatId, organizationId } = await createTestMessage();
    
    const context = await getMessageContext(messageId);
    
    expect(context.message.id).toBe(messageId);
    expect(context.chat.id).toBe(chatId);
    expect(context.user.id).toBe(userId);
    expect(context.organization.id).toBe(organizationId);
    expect(context.dataSource).toBeTruthy();
  });
  
  test('getMessageContext throws for non-existent message', async () => {
    await expect(getMessageContext('invalid-message-id'))
      .rejects.toThrow('Message not found or has been deleted');
  });
  
  test('loadConversationHistory returns ordered messages', async () => {
    const { chatId } = await createTestChatWithMessages(3);
    
    const history = await loadConversationHistory(chatId);
    
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
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