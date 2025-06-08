# Task 3: Runtime Context Setup from Message Context

## Overview
Simplified runtime context setup that derives all context from the message_id. Since getMessageContext() already loads the complete user → organization → dataSource chain, this task simply formats that data for the analyst workflow.

## Requirements

### Core Functionality
- Use message context to populate RuntimeContext for analyst workflow
- No authentication needed (handled by web server)
- No database lookups needed (already done by getMessageContext)
- Simple formatting of existing context data

## Implementation Details

### File: `analyst-agent-task.ts` (Runtime Context Section)

```typescript
import type { AnalystRuntimeContext } from '@packages/ai/src/workflows/analyst-workflow';
import type { MessageContext } from './types';

/**
 * Setup runtime context from message context data
 * All context loading is already done by getMessageContext()
 */
function setupRuntimeContextFromMessage(messageContext: MessageContext): RuntimeContext<AnalystRuntimeContext> {
  const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
  
  // Populate from message context
  runtimeContext.set('userId', messageContext.user.id);
  runtimeContext.set('threadId', messageContext.chat.id);
  runtimeContext.set('organizationId', messageContext.organization.id);
  runtimeContext.set('dataSourceId', messageContext.dataSource.id);
  runtimeContext.set('dataSourceSyntax', messageContext.dataSource.type);
  runtimeContext.set('todos', ''); // Initialize as empty
  
  return runtimeContext;
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
      // 1. Load message context (includes all user/chat/org/dataSource info)
      const messageContext = await getMessageContext(payload.message_id);
      
      // 2. Setup runtime context from message context (simple formatting)
      const runtimeContext = setupRuntimeContextFromMessage(messageContext);
      
      // 3. Load conversation history for the chat
      const conversationHistory = await loadConversationHistory(messageContext.chat.id);
      
      // 4. Prepare workflow input
      const workflowInput = {
        prompt: messageContext.message.requestMessage,
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
          message: error.message
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
1. getMessageContext(message_id) → complete context
   ↓
2. setupRuntimeContextFromMessage() → format for workflow
   ↓
Output: RuntimeContext<AnalystRuntimeContext> ready for workflow
```

### AnalystRuntimeContext Structure

```typescript
interface AnalystRuntimeContext {
  userId: string;           // From messageContext.user.id
  threadId: string;         // From messageContext.chat.id
  dataSourceId: string;     // From messageContext.dataSource.id
  dataSourceSyntax: string; // From messageContext.dataSource.type
  organizationId: string;   // From messageContext.organization.id
  todos: string;           // Initialized as empty string
}
```

## Dependencies

- Task 2: Database Helper Functions (`getMessageContext`)
- Existing analyst workflow integration

## Testing Strategy

### Unit Tests

```typescript
describe('Simplified Runtime Context Setup', () => {
  test('formats message context for workflow', () => {
    const mockMessageContext = {
      user: { id: 'user-123' },
      chat: { id: 'chat-456' },
      organization: { id: 'org-789' },
      dataSource: { id: 'ds-101', type: 'postgresql' }
    };
    
    const runtimeContext = setupRuntimeContextFromMessage(mockMessageContext);
    
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

### With Database Helpers
```typescript
import { getMessageContext } from '@buster/database';
```

### With Analyst Workflow
```typescript
const runtimeContext = setupRuntimeContextFromMessage(messageContext);
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