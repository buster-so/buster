# Task 3: Runtime Context Setup from Message Context

## Overview
Simplified runtime context setup that derives all context from the message_id using Task 2's database helpers. The RuntimeContext comes from the Mastra package and is populated with data from the database helper functions.

## Requirements

### Core Functionality
- Use Task 2's database helpers to load message context, conversation history, and data source info
- Populate Mastra's RuntimeContext for analyst workflow
- No authentication needed (handled by web server)
- Concurrent optimization for efficient data loading
- Proper error handling following Task 2 patterns

## Implementation Details

### File: `analyst-agent-task.ts` (Runtime Context Section)

```typescript
import { RuntimeContext } from '@mastra/core'; // Runtime context comes from Mastra package
import type { AnalystRuntimeContext } from '@packages/ai/src/workflows/analyst-workflow';
import type {
  MessageContextOutput,
  OrganizationDataSourceOutput,
} from '@buster/database';

/**
 * Setup runtime context from Task 2 database helper outputs
 * Uses individual helper results to populate Mastra RuntimeContext
 */
function setupRuntimeContextFromMessage(
  messageContext: MessageContextOutput,
  dataSource: OrganizationDataSourceOutput
): RuntimeContext<AnalystRuntimeContext> {
  try {
    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    
    // Populate from Task 2 helper outputs
    runtimeContext.set('userId', messageContext.userId);
    runtimeContext.set('threadId', messageContext.chatId);
    runtimeContext.set('organizationId', messageContext.organizationId);
    runtimeContext.set('dataSourceId', dataSource.dataSourceId);
    runtimeContext.set('dataSourceSyntax', dataSource.dataSourceSyntax);
    runtimeContext.set('todos', ''); // Initialize as empty
    
    return runtimeContext;
  } catch (error) {
    throw error instanceof Error ? error : new Error(`Failed to setup runtime context: ${String(error)}`);
  }
}

```

### Integration with Main Task Logic

```typescript
export const analystAgentTask = schemaTask({
  id: 'analyst-agent-task',
  schema: AnalystAgentTaskInputSchema,
  maxDuration: 1800,
  run: async (payload): Promise<AnalystAgentTaskOutput> => {
    try {
      // 1. Load message context and conversation history concurrently (Task 2 optimization)
      const [messageContext, conversationHistory] = await Promise.all([
        getMessageContext({ messageId: payload.message_id }),
        getChatConversationHistory({ messageId: payload.message_id }),
      ]);
      
      // 2. Load data source using organizationId from message context
      const dataSource = await getOrganizationDataSource({ 
        organizationId: messageContext.organizationId 
      });
      
      // 3. Setup runtime context from Task 2 helper outputs
      const runtimeContext = setupRuntimeContextFromMessage(messageContext, dataSource);
      
      // 4. Prepare workflow input
      const workflowInput = {
        prompt: messageContext.requestMessage,
        conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
      };
      
      // 5. Execute analyst workflow
      await analystWorkflow.createRun().start({
        inputData: workflowInput,
        runtimeContext
      });
      
      return {
        success: true,
        messageId: payload.message_id,
      };
      
    } catch (error) {
      return {
        success: false,
        messageId: payload.message_id,
        error: {
          code: getErrorCode(error),
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  },
});
```

## Simplified Data Flow

### Context Resolution Flow

```
Input: message_id
   ↓
1. getMessageContext({ messageId }) + getChatConversationHistory({ messageId }) [concurrent]
   ↓
2. getOrganizationDataSource({ organizationId }) [using result from step 1]
   ↓
3. setupRuntimeContextFromMessage(messageContext, dataSource) → format for Mastra workflow
   ↓
Output: RuntimeContext<AnalystRuntimeContext> ready for analyst workflow
```

### AnalystRuntimeContext Structure

```typescript
interface AnalystRuntimeContext {
  userId: string;           // From messageContext.userId
  threadId: string;         // From messageContext.chatId
  dataSourceId: string;     // From dataSource.dataSourceId
  dataSourceSyntax: string; // From dataSource.dataSourceSyntax
  organizationId: string;   // From messageContext.organizationId
  todos: string;           // Initialized as empty string
}
```

## Dependencies

- Task 2: Database Helper Functions (`getMessageContext`, `getChatConversationHistory`, `getOrganizationDataSource`)
- Mastra package: `RuntimeContext` class
- Existing analyst workflow integration

## Testing Strategy

### Unit Tests

```typescript
describe('Simplified Runtime Context Setup', () => {
  test('formats Task 2 helper outputs for workflow', () => {
    const mockMessageContext: MessageContextOutput = {
      messageId: 'msg-123',
      userId: 'user-123',
      chatId: 'chat-456',
      organizationId: 'org-789',
      requestMessage: 'Test prompt'
    };
    
    const mockDataSource: OrganizationDataSourceOutput = {
      dataSourceId: 'ds-101',
      dataSourceSyntax: 'postgresql'
    };
    
    const runtimeContext = setupRuntimeContextFromMessage(mockMessageContext, mockDataSource);
    
    expect(runtimeContext.get('userId')).toBe('user-123');
    expect(runtimeContext.get('threadId')).toBe('chat-456');
    expect(runtimeContext.get('organizationId')).toBe('org-789');
    expect(runtimeContext.get('dataSourceId')).toBe('ds-101');
    expect(runtimeContext.get('dataSourceSyntax')).toBe('postgresql');
    expect(runtimeContext.get('todos')).toBe('');
  });
});
```

## Integration Points

### With Database Helpers (Task 2)
```typescript
import {
  getMessageContext,
  getChatConversationHistory,
  getOrganizationDataSource,
} from '@buster/database';
```

### With Analyst Workflow
```typescript
const runtimeContext = setupRuntimeContextFromMessage(messageContext, dataSource);
await analystWorkflow.createRun().start({
  inputData: workflowInput,
  runtimeContext
});
```

## Deliverables

1. **Runtime Context Formatting Function** - `setupRuntimeContextFromMessage()`
2. **Integration Code** - Connection with main task logic
3. **Unit Tests** - Basic functionality testing

## Estimated Effort

- **Implementation**: 1-2 hours
- **Testing**: 1 hour
- **Integration**: 1 hour
- **Total**: 3-4 hours