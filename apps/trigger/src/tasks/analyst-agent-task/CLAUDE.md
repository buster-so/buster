# CLAUDE.md - Analyst Agent Task

This file provides comprehensive guidance for Claude Code when working with the Analyst Agent Task implementation. This task represents a complete, production-ready background job that executes AI-powered data analysis workflows.

## What We Accomplished

### ✅ Complete Implementation Status
All documented tasks (1-5) have been **fully implemented and tested**:

1. **Task 1**: Request schema with Zod validation ✅
2. **Task 2**: Database helper functions in `@buster/database` ✅  
3. **Task 3**: Runtime context setup logic ✅
4. **Task 4**: Chat history loading with conversation continuity ✅
5. **Task 5**: Complete workflow integration with Mastra and Braintrust ✅

### Core Implementation Files
- `analyst-agent-task.ts` - Main task implementation with workflow integration
- `types.ts` - Zod schemas and TypeScript type definitions
- `index.ts` - Task exports for module system
- `runtime-context-setup.test.ts` - Comprehensive test coverage
- `README.md` - User-facing documentation with examples

## Architecture Overview

### Simplified Flow Design
The implementation follows a streamlined architecture where the web server handles all setup and this task focuses purely on AI execution:

```
Web Server → Trigger Task → AI Workflow → Database Persistence
     ↓            ↓             ↓              ↓
1. Create msg   2. Load      3. Execute    4. Save results
2. Load assets     context      analyst      back to msg
3. Trigger task    & history    workflow
```

### Key Design Principles
1. **Single Responsibility**: Task only executes AI workflow - no auth, asset loading, or chat management
2. **Database Helper Pattern**: All database operations go through tested helper functions
3. **Concurrent Loading**: Optimized with `Promise.all` for parallel data fetching
4. **Error Isolation**: Clear separation between setup errors and workflow execution errors
5. **Observability**: Full Braintrust tracing and structured logging throughout

## How It Works

### Input Processing
The task receives a simple payload:
```typescript
{ message_id: string }  // UUID validated with Zod
```

### Execution Flow
1. **Context Loading** (Tasks 2 & 4):
   ```typescript
   const [messageContext, conversationHistory] = await Promise.all([
     getMessageContext({ messageId: payload.message_id }),
     getChatConversationHistory({ messageId: payload.message_id }),
   ]);
   ```

2. **Data Source Resolution** (Task 2):
   ```typescript
   const dataSource = await getOrganizationDataSource({
     organizationId: messageContext.organizationId,
   });
   ```

3. **Runtime Context Setup** (Task 3):
   ```typescript
   const runtimeContext = setupRuntimeContextFromMessage(
     messageContext,
     dataSource,
     payload.message_id
   );
   ```

4. **Workflow Execution** (Task 5):
   ```typescript
   const workflowResult = await wrapTraced(
     async () => {
       const run = analystWorkflow.createRun();
       return await run.start({
         inputData: workflowInput,
         runtimeContext,
       });
     },
     { name: 'Analyst Agent Task Workflow', metadata: {...} }
   );
   ```

### Database Helper Integration
The task leverages three key helpers from `@buster/database`:

#### `getMessageContext({ messageId })`
Returns:
```typescript
{
  messageId: string;
  userId: string;
  chatId: string;
  organizationId: string;
  requestMessage: string;
}
```

#### `getChatConversationHistory({ messageId })`
Returns: `CoreMessage[]` formatted for AI workflow consumption

#### `getOrganizationDataSource({ organizationId })`
Returns:
```typescript
{
  dataSourceId: string;
  dataSourceSyntax: string;
}
```

## How to Use It

### Triggering the Task
```typescript
import { tasks } from '@trigger.dev/sdk/v3';
import type { analystAgentTask } from '~/trigger/src/tasks/analyst-agent-task';

// Basic trigger
const handle = await tasks.trigger<typeof analystAgentTask>(
  analyst_agent_task_keys.analyst_agent_task,
  { message_id: 'uuid-message-id-here' }
);

// Monitor execution
const result = await handle.pollUntilCompletion();
```

### Prerequisites
Before triggering, ensure:
1. Message exists in database with valid `requestMessage`
2. User and chat context are properly linked
3. Organization has an associated data source
4. Conversation history is loaded (can be empty for new chats)

### Expected Workflow
1. **Web Server**: Creates message with user request → Returns message_id
2. **Trigger Task**: Loads context → Executes AI analysis → Saves results
3. **Frontend**: Polls for completion or receives real-time updates

## Runtime Context Structure

The task populates a Mastra `RuntimeContext<AnalystRuntimeContext>` with:

```typescript
interface AnalystRuntimeContext {
  userId: string;           // For user-specific operations
  threadId: string;         // Chat ID for conversation context
  organizationId: string;   // Organization scope
  dataSourceId: string;     // Primary data source
  dataSourceSyntax: string; // SQL syntax (postgresql, snowflake, etc.)
  todos: string;           // Initialized empty for workflow use
  messageId: string;       // For result persistence
}
```

This context enables the AI workflow to:
- Execute queries with correct SQL syntax
- Save results back to the originating message
- Maintain user and organization boundaries
- Access appropriate data sources

## Error Handling Strategy

### Comprehensive Error Classification
The task implements detailed error categorization:

```typescript
// Task 1: Schema validation errors
'VALIDATION_ERROR'

// Task 2: Database helper errors  
'MESSAGE_NOT_FOUND'
'INVALID_MESSAGE_STATE'
'DATA_SOURCE_NOT_FOUND'
'MULTIPLE_DATA_SOURCES_ERROR'
'DATABASE_ERROR'
'DATA_VALIDATION_ERROR'

// Task 3: Runtime context errors
'RUNTIME_CONTEXT_ERROR'

// Task 5: Workflow execution errors
'WORKFLOW_EXECUTION_ERROR'
'AGENT_EXECUTION_ERROR'
'WORKFLOW_STEP_ERROR'
```

### Error Recovery Patterns
- **Database Errors**: Retry with exponential backoff
- **Validation Errors**: Immediate failure with detailed feedback
- **Workflow Errors**: Graceful degradation when possible
- **Context Errors**: Clear error messages for debugging

## Testing Coverage

### Unit Tests (`runtime-context-setup.test.ts`)
- Runtime context setup from database outputs ✅
- Error handling for invalid inputs ✅
- Integration patterns with database helpers ✅
- Conversation history processing ✅
- Concurrent loading verification ✅

### Integration Points Tested
- Task 2 helper output formatting
- Task 3 runtime context population
- Task 4 conversation history handling
- Error propagation patterns

## Performance Optimizations

### Concurrent Operations
```typescript
// Parallel loading of independent data
const [messageContext, conversationHistory] = await Promise.all([
  getMessageContext({ messageId: payload.message_id }),
  getChatConversationHistory({ messageId: payload.message_id }),
]);
```

### Resource Management
- **30-minute timeout**: Sufficient for complex analysis without resource waste
- **Braintrust tracing**: Minimal overhead observability
- **Structured logging**: Efficient debugging without performance impact
- **Connection cleanup**: Handled by database helper layer

## Observability & Monitoring

### Braintrust Integration
Full tracing with metadata:
```typescript
const tracedWorkflow = wrapTraced(
  async () => { /* workflow execution */ },
  { 
    name: 'Analyst Agent Task Workflow',
    metadata: {
      messageId,
      organizationId,
      dataSourceId,
      hasConversationHistory,
    }
  }
);
```

### Structured Logging
Key events logged:
- Task start with message ID
- Context loading completion
- Data source resolution
- Workflow execution start/completion
- Error details with context

## Integration Guidelines

### When Adding New Features
1. **Follow the helper pattern**: Add new operations to `@buster/database` helpers
2. **Maintain error boundaries**: Clear separation between setup and execution errors
3. **Preserve concurrency**: Use `Promise.all` for independent operations
4. **Update tests**: Extend `runtime-context-setup.test.ts` for new functionality
5. **Document changes**: Update this CLAUDE.md with new patterns

### When Modifying Existing Code
1. **Preserve the task boundaries**: Don't add auth, asset loading, or chat management
2. **Maintain backward compatibility**: Existing message_id inputs should still work
3. **Keep helper contracts stable**: Database helper interfaces are used by tests
4. **Update error codes**: Add new error classifications as needed

### When Debugging Issues
1. **Check Braintrust traces**: Full execution visibility with metadata
2. **Review structured logs**: Task execution timeline and context
3. **Validate database helpers**: Test individual helper functions first
4. **Verify runtime context**: Ensure all required fields are populated

## Security Considerations

### Data Isolation
- **User boundaries**: Runtime context ensures user-scoped operations
- **Organization limits**: Data source access controlled by organization
- **Message ownership**: Validation ensures user owns the message

### Credential Management
- **No direct credential handling**: Database helpers manage data source access
- **Secure context passing**: Runtime context contains IDs, not credentials
- **Audit trail**: All operations logged with user and organization context

## Future Engineer Guidelines

### Understanding the Codebase
1. **Start with `OVERVIEW.md`**: High-level architecture and task breakdown
2. **Review `types.ts`**: Understand data structures and validation
3. **Study `analyst-agent-task.ts`**: Main implementation with detailed comments
4. **Run tests**: `runtime-context-setup.test.ts` demonstrates usage patterns

### Making Changes
1. **Follow existing patterns**: Helper functions, error handling, logging
2. **Maintain test coverage**: Add tests for new functionality
3. **Preserve simplicity**: Single responsibility - just execute AI workflow
4. **Document thoroughly**: Update relevant .md files

### Common Modifications
- **Adding context fields**: Update `AnalystRuntimeContext` type and setup function
- **New error conditions**: Add error codes and handling patterns
- **Performance tuning**: Optimize database helper calls or concurrency
- **Observability enhancements**: Add metadata or logging points

## Success Metrics

The implementation achieves all project goals:
- ✅ **Simplified architecture**: Single message_id input, clear execution flow
- ✅ **Robust error handling**: Comprehensive error codes and recovery patterns
- ✅ **Performance optimized**: Concurrent loading, efficient resource usage
- ✅ **Full observability**: Braintrust tracing and structured logging
- ✅ **Test coverage**: Unit tests for all critical paths
- ✅ **Documentation**: Complete user and developer documentation

This implementation serves as a **reference pattern** for other Trigger.dev v3 tasks in the codebase, demonstrating best practices for schema validation, database integration, error handling, and observability.