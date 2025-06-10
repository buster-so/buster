# TICKET-004: Error Handling Standardization

**Priority**: 🔴 Critical  
**Estimated Effort**: 3-4 days  
**Dependencies**: TICKET-001 (Type Safety Foundation)  
**Blocks**: TICKET-008, TICKET-009

## Problem Statement

Error handling is inconsistent across tools and steps, leading to unpredictable error responses and poor user experience. Different components handle errors differently, and error messages are often too technical for end users.

## Current Issues

### Inconsistent Error Patterns:
```typescript
// ❌ Pattern 1: Basic error wrapping
} catch (error) {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'SQL execution failed',
  };
}

// ❌ Pattern 2: Re-throwing with transformation  
} catch (error) {
  console.error('Failed to create todos:', error);
  throw new Error('Unable to create the analysis plan. Please try again or rephrase your request.');
}

// ❌ Pattern 3: Silent fallback
} catch (error) {
  console.error('Failed to extract values:', error);
  return { values: [] }; // Silent failure
}
```

### Problems:
- Inconsistent error response formats
- Mix of technical and user-friendly messages
- Some errors are swallowed silently
- No standardized error categorization
- Missing error correlation/tracking

## Scope

### Files to Modify:
- `src/utils/error-handling.ts` (new file)
- `src/utils/error-types.ts` (new file)
- All tool implementations
- All step implementations
- `src/workflows/analyst-workflow.ts`

### Changes Required:

#### 1. Create Error Types and Categories
```typescript
// src/utils/error-types.ts
export enum ErrorCategory {
  VALIDATION = 'validation',
  DATABASE = 'database', 
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  RESOURCE_LIMIT = 'resource_limit',
  TOOL_EXECUTION = 'tool_execution',
  MODEL_API = 'model_api',
  CONFIGURATION = 'configuration',
  UNKNOWN = 'unknown'
}

export interface AnalystError {
  category: ErrorCategory;
  code: string;
  message: string; // User-friendly message
  technicalMessage?: string; // Technical details for logging
  context?: Record<string, any>;
  retryable: boolean;
}

export class AnalystWorkflowError extends Error {
  public readonly category: ErrorCategory;
  public readonly code: string;
  public readonly technicalMessage?: string;
  public readonly context?: Record<string, any>;
  public readonly retryable: boolean;

  constructor(error: AnalystError) {
    super(error.message);
    this.name = 'AnalystWorkflowError';
    this.category = error.category;
    this.code = error.code;
    this.technicalMessage = error.technicalMessage;
    this.context = error.context;
    this.retryable = error.retryable;
  }
}
```

#### 2. Create Error Handling Utilities
```typescript
// src/utils/error-handling.ts
import { logger } from './logger';
import { ErrorCategory, AnalystWorkflowError, type AnalystError } from './error-types';

export function handleToolError(
  error: unknown,
  operation: string,
  context?: Record<string, any>
): never {
  const analystError = categorizeError(error, operation, context);
  
  // Log technical details
  logger.error(`Tool error in ${operation}`, {
    category: analystError.category,
    code: analystError.code,
    technicalMessage: analystError.technicalMessage,
    context: analystError.context,
    originalError: error
  });

  // Throw user-friendly error
  throw new AnalystWorkflowError(analystError);
}

export function categorizeError(
  error: unknown, 
  operation: string,
  context?: Record<string, any>
): AnalystError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Database errors
  if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('connection')) {
    return {
      category: ErrorCategory.DATABASE,
      code: 'DB_CONNECTION_FAILED',
      message: 'Unable to connect to the analysis service. Please try again later.',
      technicalMessage: errorMessage,
      context: { operation, ...context },
      retryable: true
    };
  }

  // API/Model errors
  if (errorMessage.includes('API') || errorMessage.includes('model') || errorMessage.includes('rate limit')) {
    return {
      category: ErrorCategory.MODEL_API,
      code: 'MODEL_API_ERROR',
      message: 'The analysis service is temporarily unavailable. Please try again in a few moments.',
      technicalMessage: errorMessage,
      context: { operation, ...context },
      retryable: true
    };
  }

  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
    return {
      category: ErrorCategory.VALIDATION,
      code: 'VALIDATION_FAILED',
      message: 'Invalid input provided. Please check your request and try again.',
      technicalMessage: errorMessage,
      context: { operation, ...context },
      retryable: false
    };
  }

  // Authentication/Authorization errors
  if (errorMessage.includes('unauthorized') || errorMessage.includes('permission') || errorMessage.includes('session')) {
    return {
      category: ErrorCategory.AUTHENTICATION,
      code: 'AUTH_FAILED',
      message: 'Unable to access your session. Please refresh and try again.',
      technicalMessage: errorMessage,
      context: { operation, ...context },
      retryable: false
    };
  }

  // Resource limit errors
  if (errorMessage.includes('timeout') || errorMessage.includes('limit') || errorMessage.includes('memory')) {
    return {
      category: ErrorCategory.RESOURCE_LIMIT,
      code: 'RESOURCE_LIMIT_EXCEEDED',
      message: 'Request too large or complex. Please try with a simpler request.',
      technicalMessage: errorMessage,
      context: { operation, ...context },
      retryable: false
    };
  }

  // Default unknown error
  return {
    category: ErrorCategory.UNKNOWN,
    code: 'UNKNOWN_ERROR',
    message: `Something went wrong during ${operation}. Please try again or contact support if the issue persists.`,
    technicalMessage: errorMessage,
    context: { operation, ...context },
    retryable: true
  };
}

export function createUserFriendlyError(message: string, retryable = true): AnalystWorkflowError {
  return new AnalystWorkflowError({
    category: ErrorCategory.TOOL_EXECUTION,
    code: 'USER_ERROR',
    message,
    retryable
  });
}

export function isRetryableError(error: Error): boolean {
  if (error instanceof AnalystWorkflowError) {
    return error.retryable;
  }
  return false;
}
```

#### 3. Standardize Tool Error Handling
Apply to all tools using this pattern:

```typescript
// Example: execute-sql.ts
import { handleToolError } from '../utils/error-handling';

const executeFunction = wrapTraced(
  async (input: z.infer<typeof inputSchema>, context: any) => {
    try {
      // Tool logic here...
      return { success: true, data: result };
    } catch (error) {
      handleToolError(error, 'SQL execution', { 
        query: input.query,
        dataSourceId: context.dataSourceId 
      });
    }
  },
  { name: 'execute-sql' }
);
```

#### 4. Standardize Step Error Handling
Apply to all steps:

```typescript
// Example: analyst-step.ts  
import { handleToolError, categorizeError } from '../utils/error-handling';

const analystExecution = async ({ inputData, runtimeContext }) => {
  try {
    // Step logic...
  } catch (error) {
    // Handle abort errors gracefully (expected)
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        conversationHistory: completeConversationHistory,
        finished: true,
        outputMessages: completeConversationHistory,
      };
    }

    // Handle all other errors with standardized error handling
    handleToolError(error, 'data analysis', {
      stepName: 'analyst-step',
      messageCount: inputData.outputMessages?.length
    });
  }
};
```

#### 5. Add Workflow-Level Error Boundary
```typescript
// src/workflows/analyst-workflow.ts
import { handleToolError } from '../utils/error-handling';

const analystWorkflow = createWorkflow({
  id: 'analyst-workflow',
  inputSchema: thinkAndPrepWorkflowInputSchema,
  outputSchema,
  onError: async (error, context) => {
    handleToolError(error, 'workflow execution', {
      workflowId: 'analyst-workflow',
      step: context.currentStep,
      input: context.inputData
    });
  },
  steps: [
    // ... existing steps
  ]
});
```

## Acceptance Criteria

- [ ] All errors follow standardized AnalystWorkflowError format
- [ ] User-friendly error messages for all error categories
- [ ] Technical error details logged but not exposed to users
- [ ] Consistent error response format across all tools
- [ ] Error categorization enables proper handling/retry logic
- [ ] No silent error swallowing
- [ ] Error context includes relevant debugging information

## Test Plan

- [ ] Unit tests for error categorization logic
- [ ] Test each error category with appropriate inputs
- [ ] Verify user-friendly messages are returned
- [ ] Test error logging includes technical details
- [ ] Integration tests for workflow-level error handling
- [ ] Test retry logic based on error categories

## Error Response Format

All tools should return errors in this format:
```typescript
// For tools that return success/error objects
{
  success: false,
  error: userFriendlyMessage,
  code: errorCode,
  retryable: boolean
}

// For tools that throw errors
throw new AnalystWorkflowError({
  category: ErrorCategory.DATABASE,
  code: 'DB_CONNECTION_FAILED', 
  message: 'User-friendly message',
  technicalMessage: 'Technical details',
  retryable: true
});
```

## Migration Strategy

1. **Phase 1**: Create error utilities and types
2. **Phase 2**: Update database tools (highest risk)
3. **Phase 3**: Update communication and planning tools
4. **Phase 4**: Update visualization tools
5. **Phase 5**: Add workflow-level error boundary

## Notes

This ticket requires TICKET-001 (Type Safety) to be completed first as it builds on the validation utilities. Once complete, it enables better testing and monitoring capabilities.