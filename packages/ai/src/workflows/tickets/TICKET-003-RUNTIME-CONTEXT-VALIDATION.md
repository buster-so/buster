# TICKET-003: Runtime Context Validation

**Priority**: 🔴 Critical  
**Estimated Effort**: 2-3 days  
**Dependencies**: TICKET-001 (Type Safety Foundation)  
**Blocks**: TICKET-006, TICKET-007

## Problem Statement

Runtime context is accessed without validation across all workflow steps, leading to potential undefined values and unclear error messages when required context is missing.

## Current Issues

### Missing Validation Examples:
```typescript
// ❌ Unsafe access without validation
const userId = runtimeContext.get('userId'); // Could be undefined
const threadId = runtimeContext.get('threadId'); // Could be undefined
const dataSourceId = runtimeContext.get('dataSourceId'); // Could be undefined
```

### Files Affected:
- All step implementations
- Tool implementations that use runtime context
- Workflow initialization

## Scope

### Files to Modify:
- `src/workflows/analyst-workflow.ts`
- `src/steps/analyst-step.ts`
- `src/steps/think-and-prep-step.ts`
- `src/steps/create-todos-step.ts`
- `src/steps/extract-values-search-step.ts`
- `src/steps/generate-chat-title-step.ts`
- `src/utils/context-validation.ts` (new file)
- All tools that access runtime context

### Changes Required:

#### 1. Create Context Validation Utilities
```typescript
// src/utils/context-validation.ts
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { AnalystRuntimeContext } from '../workflows/analyst-workflow';

export function validateAnalystRuntimeContext(
  context: RuntimeContext<AnalystRuntimeContext>
): void {
  const requiredFields: (keyof AnalystRuntimeContext)[] = [
    'userId',
    'threadId', 
    'dataSourceId',
    'dataSourceSyntax',
    'organizationId',
  ];

  const missing: string[] = [];
  
  for (const field of requiredFields) {
    const value = context.get(field);
    if (!value) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required runtime context fields: ${missing.join(', ')}. ` +
      'Please ensure all required context is provided before starting the workflow.'
    );
  }
}

export function getValidatedContext<T extends AnalystRuntimeContext>(
  context: RuntimeContext<T>
): Required<Pick<T, 'userId' | 'threadId' | 'dataSourceId' | 'dataSourceSyntax' | 'organizationId'>> {
  validateAnalystRuntimeContext(context as any);
  
  return {
    userId: context.get('userId')!,
    threadId: context.get('threadId')!,
    dataSourceId: context.get('dataSourceId')!,
    dataSourceSyntax: context.get('dataSourceSyntax')!,
    organizationId: context.get('organizationId')!,
  };
}

export function getOptionalContext<T extends AnalystRuntimeContext>(
  context: RuntimeContext<T>
): Partial<Pick<T, 'messageId' | 'todos'>> {
  return {
    messageId: context.get('messageId'),
    todos: context.get('todos'),
  };
}
```

#### 2. Update Analyst Step
```typescript
// src/steps/analyst-step.ts
import { validateAnalystRuntimeContext, getValidatedContext } from '../utils/context-validation';

const analystExecution = async ({
  inputData,
  runtimeContext,
}: {
  // ... existing params
}): Promise<z.infer<typeof outputSchema>> => {
  try {
    // ✅ Validate context at start of execution
    validateAnalystRuntimeContext(runtimeContext);
    const { userId, threadId } = getValidatedContext(runtimeContext);

    // Continue with validated context values...
  } catch (error) {
    // Handle validation errors with user-friendly messages
    if (error instanceof Error && error.message.includes('Missing required runtime context')) {
      throw new Error('Unable to access your session. Please refresh and try again.');
    }
    throw error;
  }
};
```

#### 3. Update Think-and-Prep Step
```typescript
// src/steps/think-and-prep-step.ts
import { validateAnalystRuntimeContext, getValidatedContext } from '../utils/context-validation';

const thinkAndPrepExecution = async ({
  inputData,
  getInitData,
  runtimeContext,
}: {
  // ... existing params
}): Promise<z.infer<typeof outputSchema>> => {
  try {
    // ✅ Validate context early
    validateAnalystRuntimeContext(runtimeContext);
    const { userId, threadId } = getValidatedContext(runtimeContext);

    // ... rest of implementation
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing required runtime context')) {
      throw new Error('Unable to access your session. Please refresh and try again.');
    }
    throw error;
  }
};
```

#### 4. Update All Other Steps
Apply the same pattern to:
- `create-todos-step.ts`
- `extract-values-search-step.ts`  
- `generate-chat-title-step.ts`

#### 5. Add Workflow-Level Validation
```typescript
// src/workflows/analyst-workflow.ts
import { validateAnalystRuntimeContext } from '../utils/context-validation';

// Add validation before workflow execution
const workflow = createWorkflow({
  id: 'analyst-workflow',
  inputSchema: thinkAndPrepWorkflowInputSchema,
  outputSchema,
  beforeExecute: async ({ runtimeContext }) => {
    validateAnalystRuntimeContext(runtimeContext);
  },
  steps: [
    // ... existing steps
  ]
});
```

#### 6. Update Tools with Context Access
For tools that access runtime context (like `execute-sql.ts`):

```typescript
// Validate context before use
validateAnalystRuntimeContext(runtimeContext);
const { dataSourceId, organizationId } = getValidatedContext(runtimeContext);
```

## Acceptance Criteria

- [ ] All runtime context access is validated before use
- [ ] Clear, user-friendly error messages for missing context
- [ ] Validation occurs as early as possible in execution
- [ ] Required vs optional context fields are clearly distinguished
- [ ] Type safety for validated context values
- [ ] Consistent validation pattern across all components

## Test Plan

- [ ] Unit tests for validation utilities
- [ ] Test workflow execution with missing context fields
- [ ] Verify error messages are user-friendly
- [ ] Test partial context scenarios
- [ ] Integration tests with full context validation

## Error Message Standards

All context validation errors should follow this pattern:
```typescript
// For missing required fields
throw new Error('Unable to access your session. Please refresh and try again.');

// For invalid field values  
throw new Error('Session information is invalid. Please refresh and try again.');

// For development/debugging (logged, not thrown to user)
logger.error('Runtime context validation failed', { missing, context });
```

## Notes

This ticket builds on the type safety foundation from TICKET-001 and is critical for preventing unclear runtime failures. Once complete, it enables more robust error handling and resource management tickets.