# Task 1: Request Object Structure & Validation ✅ COMPLETED

## Overview
Create a simple Zod schema for the analyst agent task that takes only a message_id as input. The web server handles all complexity (authentication, chat creation, asset loading) and this task simply executes the analyst workflow.

## ✅ Completion Status
- [x] **types.ts** - Simple schema definitions with validation ✅ IMPLEMENTED
- [x] **Unit tests** - Input validation testing ✅ VERIFIED  
- [x] **Type exports** - TypeScript types for import by other modules ✅ IMPLEMENTED
- [x] **Error mapping** - Standard error codes and messages ✅ IMPLEMENTED
- [x] **TypeScript compilation** - No type errors ✅ VERIFIED
- [x] **Biome linting** - Code formatting and style ✅ VERIFIED  
- [x] **Index exports** - Proper module exports ✅ VERIFIED

## Requirements

### Input Schema Design
The input schema is extremely simple - just a message_id that points to the message to process.

### Core Fields
```typescript
{
  message_id: string,  // UUID of the message to process
}
```

## Implementation Details

### File: `types.ts`

#### 1. Input Schema
```typescript
import { z } from 'zod';

// UUID validation schema
export const UUIDSchema = z.string().uuid('Must be a valid UUID');

// Simple input schema - just message_id
export const AnalystAgentTaskInputSchema = z.object({
  message_id: UUIDSchema,
});
```

#### 2. Output Schema
```typescript
// Task execution result (for Trigger.dev monitoring)
export const TaskExecutionResultSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
  executionTimeMs: z.number(),
  workflowCompleted: z.boolean(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
  }).optional(),
});

// Main output schema (Trigger.dev requires this for task definition)
export const AnalystAgentTaskOutputSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
  result: TaskExecutionResultSchema.optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
  }).optional(),
});
```

#### 3. Context Schemas (for internal use)
```typescript
// Message context loaded from database
export const MessageContextSchema = z.object({
  message: z.object({
    id: z.string(),
    requestMessage: z.string().nullable(),
    chatId: z.string(),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  chat: z.object({
    id: z.string(),
    title: z.string(),
    organizationId: z.string(),
    createdBy: z.string(),
  }),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
  }),
  organization: z.object({
    id: z.string(),
    name: z.string(),
  }),
  dataSource: z.object({
    id: z.string(),
    type: z.string(),
    organizationId: z.string(),
  }),
});

// Conversation history schema (from AI package)
export const ConversationMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.any(), // Can be string or complex types for tool messages
  id: z.string().optional(),
});

export const ConversationHistorySchema = z.array(ConversationMessageSchema);
```

#### 4. TypeScript Type Exports
```typescript
// Inferred TypeScript types
export type AnalystAgentTaskInput = z.infer<typeof AnalystAgentTaskInputSchema>;
export type AnalystAgentTaskOutput = z.infer<typeof AnalystAgentTaskOutputSchema>;
export type TaskExecutionResult = z.infer<typeof TaskExecutionResultSchema>;
export type MessageContext = z.infer<typeof MessageContextSchema>;
export type ConversationHistory = z.infer<typeof ConversationHistorySchema>;
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;
```

## Validation Rules

### 1. Message ID Requirements
- **Required**: message_id must be provided
- **Format**: Must be a valid UUID format
- **Existence**: Database lookup will validate message exists

### 2. Error Handling
```typescript
// Example validation error responses
{
  success: false,
  messageId: payload.message_id,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'message_id must be a valid UUID',
    details: {
      field: 'message_id',
      received: 'invalid-uuid',
      expected: 'valid UUID string'
    }
  }
}
```

### 3. Business Logic Errors
```typescript
// Message not found
{
  success: false,
  messageId: payload.message_id,
  error: {
    code: 'MESSAGE_NOT_FOUND',
    message: 'Message not found or has been deleted',
    details: {
      messageId: payload.message_id
    }
  }
}

// Message missing context
{
  success: false,
  messageId: payload.message_id,
  error: {
    code: 'INVALID_MESSAGE_STATE',
    message: 'Message is missing required context for processing',
    details: {
      messageId: payload.message_id,
      missingFields: ['requestMessage', 'chatId']
    }
  }
}
```

## Integration Points

### With Database Package
- Schema definitions align with database table structures
- UUID validation matches database field types
- MessageContext schema matches database query results

### With AI Workflow
- ConversationHistorySchema matches analyst workflow input expectations
- Output schema provides task completion status
- Runtime context derived from MessageContext

### With Trigger.dev
- Input schema used with `schemaTask` for automatic validation
- Output schema provides structured task results
- Simple payload structure for easy triggering

## Task Implementation Example

```typescript
import { schemaTask } from '@trigger.dev/sdk/v3';
import { AnalystAgentTaskInputSchema, AnalystAgentTaskOutputSchema } from './types';

export const analystAgentTask = schemaTask({
  id: 'analyst-agent-task',
  schema: AnalystAgentTaskInputSchema,
  maxDuration: 1800, // 30 minutes
  run: async (payload): Promise<AnalystAgentTaskOutput> => {
    try {
      // 1. Load message context
      const messageContext = await getMessageContext(payload.message_id);
      
      // 2. Setup runtime context
      const runtimeContext = await setupRuntimeContext(messageContext);
      
      // 3. Load conversation history
      const conversationHistory = await loadConversationHistory(messageContext.chat.id);
      
      // 4. Execute workflow
      await analystWorkflow.createRun().start({
        inputData: {
          prompt: messageContext.message.requestMessage,
          conversationHistory
        },
        runtimeContext
      });
      
      return {
        success: true,
        messageId: payload.message_id,
        result: {
          success: true,
          messageId: payload.message_id,
          executionTimeMs: Date.now() - startTime,
          workflowCompleted: true,
        }
      };
      
    } catch (error) {
      return {
        success: false,
        messageId: payload.message_id,
        error: {
          code: getErrorCode(error),
          message: error.message,
          details: { operation: 'analyst_workflow_execution' }
        }
      };
    }
  },
});
```

## Testing Strategy

### Schema Validation Tests
```typescript
describe('AnalystAgentTaskInputSchema', () => {
  test('valid message_id', () => {
    const input = {
      message_id: '123e4567-e89b-12d3-a456-426614174000'
    };
    expect(AnalystAgentTaskInputSchema.parse(input)).toEqual(input);
  });
  
  test('invalid UUID format', () => {
    const input = {
      message_id: 'not-a-uuid'
    };
    expect(() => AnalystAgentTaskInputSchema.parse(input)).toThrow('Must be a valid UUID');
  });
  
  test('missing message_id', () => {
    const input = {};
    expect(() => AnalystAgentTaskInputSchema.parse(input)).toThrow();
  });
});
```

### Task Integration Tests
```typescript
describe('Analyst Agent Task', () => {
  test('processes valid message successfully', async () => {
    const { messageId } = await createTestMessage();
    
    const result = await analystAgentTask.trigger({
      message_id: messageId
    });
    
    expect(result.success).toBe(true);
    expect(result.messageId).toBe(messageId);
  });
  
  test('handles non-existent message', async () => {
    const invalidMessageId = '123e4567-e89b-12d3-a456-426614174000';
    
    const result = await analystAgentTask.trigger({
      message_id: invalidMessageId
    });
    
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('MESSAGE_NOT_FOUND');
  });
});
```

## Removed Complexity

The following fields/features are no longer needed:
- ❌ `prompt` - Now loaded from message.requestMessage
- ❌ `chat_id` - Derived from message.chatId
- ❌ `asset_id` / `asset_type` - Handled by web server
- ❌ `user_id` - Derived from message.createdBy
- ❌ Authentication validation
- ❌ Multiple input scenarios
- ❌ Complex validation rules

## ✅ Deliverables - ALL COMPLETED

1. **types.ts** - Simple schema definitions with validation ✅ COMPLETED
2. **Unit tests** - Input validation testing ✅ VERIFIED
3. **Type exports** - TypeScript types for import by other modules ✅ COMPLETED
4. **Documentation** - Inline comments and examples ✅ COMPLETED
5. **Error mapping** - Standard error codes and messages ✅ COMPLETED

## Dependencies

- None (can be implemented independently) ✅ MET

## ✅ Actual Effort

- **Implementation**: 0 hours (already implemented during simplification)
- **Testing**: 0.5 hours (verification tests)
- **Quality Checks**: 0.5 hours (TypeScript + Biome + fixing issues)
- **Documentation**: 0.5 hours (status updates)
- **Total**: 1.5 hours (vs estimated 4-6 hours)

## Benefits of Simplified Approach

1. **Reduced Complexity**: Single input parameter vs complex multi-field validation
2. **Clear Responsibility**: Task focused solely on workflow execution
3. **Better Error Isolation**: Web server handles setup errors, task handles workflow errors
4. **Easier Testing**: Simple input makes testing straightforward
5. **Improved Maintainability**: Less code to maintain and debug