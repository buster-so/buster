# TICKET-001: Type Safety Foundation

**Priority**: 🔴 Critical  
**Estimated Effort**: 3-4 days  
**Dependencies**: None (Foundation ticket)  
**Blocks**: TICKET-004, TICKET-005, TICKET-008

## Problem Statement

Multiple tool implementations have unsafe type assertions and missing validation that can cause runtime failures. This affects:

- `done-tool.ts`: `input: any` parameter bypasses type safety
- `execute-sql.ts`: Unchecked array access and unsafe type assertions
- Multiple tools: Unsafe `as any` casting without validation

## Scope

### Files to Modify:
- `src/tools/communication-tools/done-tool.ts`
- `src/tools/database-tools/execute-sql.ts`
- `src/tools/visualization-tools/create-metrics-file-tool.ts`
- `src/tools/planning-thinking-tools/sequential-thinking-tool.ts`
- `src/utils/validation-helpers.ts` (new file)

### Changes Required:

#### 1. Create Validation Utilities
```typescript
// src/utils/validation-helpers.ts
export function validateRequired<T>(value: T | undefined, fieldName: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Required field ${fieldName} is missing`);
  }
  return value;
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function validateArrayAccess<T>(
  array: T[], 
  index: number, 
  context: string
): T {
  if (index < 0 || index >= array.length) {
    throw new Error(`Array index ${index} out of bounds in ${context}`);
  }
  return array[index]!;
}
```

#### 2. Fix Done Tool Type Safety
```typescript
// Replace input: any with proper interface
interface DoneToolInput {
  context?: {
    runtimeContext?: RuntimeContext;
  };
  runtimeContext?: RuntimeContext;
}

async function processDone(input: DoneToolInput): Promise<z.infer<typeof doneOutputSchema>>
```

#### 3. Fix Execute SQL Type Safety
```typescript
// Replace unsafe array access
const secretString = validateArrayAccess(
  secretResult, 
  0, 
  'database secret retrieval'
)?.decrypted_secret;

if (!secretString) {
  throw new Error('Database secret not found or invalid');
}
```

#### 4. Add Runtime Context Type Guards
```typescript
// Add to each tool that uses runtime context
function validateRuntimeContext<T>(
  context: RuntimeContext<T>, 
  requiredFields: (keyof T)[]
): void {
  for (const field of requiredFields) {
    const value = context.get(field as string);
    if (!value) {
      throw new Error(`Missing required runtime context: ${String(field)}`);
    }
  }
}
```

## Acceptance Criteria

- [ ] All tools use typed interfaces instead of `any`
- [ ] All array access is bounds-checked
- [ ] Runtime context validation is centralized
- [ ] Type assertions are replaced with type guards
- [ ] All changes have corresponding unit tests
- [ ] TypeScript strict mode passes without warnings

## Test Plan

- [ ] Unit tests for validation helpers
- [ ] Error boundary tests for each modified tool
- [ ] Runtime context validation tests
- [ ] Type safety regression tests

## Notes

This is a foundation ticket that must be completed before error handling standardization (TICKET-004) and resource management (TICKET-005) as those depend on proper type safety infrastructure.