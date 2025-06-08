# Task 4: Chat History Loading via Message Context

## Overview
Simplified chat history loading that derives the chat context from a message_id and loads conversation history for that chat. This replaces the complex multi-scenario approach with a simple message-based lookup.

## Requirements

### Core Functionality
- Load conversation history from message_id context (via chat_id)
- Use existing database helpers for simplified loading
- Format history for analyst workflow consumption
- Handle cases with no previous conversation history

## Implementation Details

### File: `analyst-agent-task.ts` (Simplified Implementation)

```typescript
import { 
  getMessageContext,
  loadConversationHistory 
} from '@buster/database';
import type { CoreMessage } from 'ai';

/**
 * Simplified workflow: Load conversation history from message context
 * This uses the chat_id from the message context to load history
 */
async function loadConversationHistoryForMessage(messageId: string): Promise<CoreMessage[]> {
  // 1. Get message context (includes chat info)
  const messageContext = await getMessageContext(messageId);
  
  // 2. Load conversation history for the chat
  const conversationHistory = await loadConversationHistory(messageContext.chat.id);
  
  // 3. Return conversation history (already formatted by database helper)
  return conversationHistory || [];
}
```

### Integration with Main Task Logic

```typescript
export const analystAgentTask = schemaTask({
  id: 'analyst-agent-task',
  schema: AnalystAgentTaskInputSchema,
  maxDuration: 1800, // 30 minutes
  run: async (payload): Promise<AnalystAgentTaskOutput> => {
    const startTime = Date.now();
    
    try {
      // 1. Load message context
      const messageContext = await getMessageContext(payload.message_id);
      
      // 2. Load conversation history for the chat
      const conversationHistory = await loadConversationHistoryForMessage(payload.message_id);
      
      // 3. Prepare workflow input
      const workflowInput = {
        prompt: messageContext.message.requestMessage,
        conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
      };
      
      // 4. Set up runtime context
      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('userId', messageContext.user.id);
      runtimeContext.set('threadId', messageContext.chat.id);
      runtimeContext.set('organizationId', messageContext.organization.id);
      runtimeContext.set('dataSourceId', messageContext.dataSource.id);
      runtimeContext.set('dataSourceSyntax', messageContext.dataSource.type);
      
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
      logger.error('Task execution failed', { 
        error: error.message,
        messageId: payload.message_id 
      });
      
      return {
        success: false,
        messageId: payload.message_id,
        error: {
          code: getErrorCode(error),
          message: error.message,
          details: {
            messageId: payload.message_id,
            operation: 'analyst_workflow_execution'
          }
        }
      };
    }
  },
});
```

## Simplified Loading Process

### Single Scenario: Message-Based Loading
```typescript
// Input (from web server)
{
  message_id: "message-uuid"
}

// Process
// 1. getMessageContext() loads message → chat → user → organization → dataSource
// 2. loadConversationHistory() loads chat history using chat.id from context
// 3. Workflow executes with complete context and history

// Expected Flow
messageId → messageContext → conversationHistory → workflowExecution
```

## Error Handling

### Simplified Error Cases
```typescript
// Context loading errors are handled by getMessageContext()
// Conversation history loading errors are handled by loadConversationHistory()
// All errors bubble up to the main task error handler

try {
  const messageContext = await getMessageContext(payload.message_id);
  const conversationHistory = await loadConversationHistoryForMessage(payload.message_id);
  // ... workflow execution
} catch (error) {
  // Error is already properly formatted by helper functions
  return {
    success: false,
    messageId: payload.message_id,
    error: {
      code: getErrorCode(error),
      message: error.message
    }
  };
}
```

## Dependencies

- Task 2: Database Helper Functions (`getMessageContext`, `loadConversationHistory`)
- Existing analyst workflow integration

## Testing Strategy

### Unit Tests

```typescript
describe('Simplified Chat History Loading', () => {
  test('loads conversation history via message context', async () => {
    const { messageId } = await createTestMessage();
    
    const conversationHistory = await loadConversationHistoryForMessage(messageId);
    
    expect(Array.isArray(conversationHistory)).toBe(true);
  });
  
  test('handles empty conversation history', async () => {
    const { messageId } = await createTestMessageInEmptyChat();
    
    const conversationHistory = await loadConversationHistoryForMessage(messageId);
    
    expect(conversationHistory).toEqual([]);
  });
});
```

## Integration Points

### With Database Helpers
```typescript
import { 
  getMessageContext,
  loadConversationHistory 
} from '@buster/database';
```

### With Analyst Workflow
```typescript
const workflowInput = {
  prompt: messageContext.message.requestMessage,
  conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
};
```

## Deliverables

1. **Simplified Loading Function** - `loadConversationHistoryForMessage()`
2. **Integration Code** - Connection with main task logic
3. **Unit Tests** - Basic functionality testing

## Estimated Effort

- **Implementation**: 2-3 hours
- **Testing**: 1-2 hours  
- **Integration**: 1 hour
- **Total**: 4-6 hours