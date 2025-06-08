# Analyst Agent Task Implementation Overview

## Project Goal

Implement a Trigger.dev v3 task that executes the analyst workflow for a given message ID. The web server handles all setup (chat creation, message creation, asset loading, authentication) and triggers this task to run the long-running AI analysis.

## Architecture

### Simplified Flow
```
Web Server:
1. User sends request → Web server handles authentication
2. Creates/updates chat and message → Returns message_id to client  
3. Loads any assets into conversation history
4. Triggers analyst agent task with message_id

Trigger Task:
1. Receives message_id
2. Loads user context and conversation history from message
3. Executes analyst workflow
4. Workflow automatically saves results back to message
```

## Core Functionality

The analyst agent task has one primary responsibility:
- **Execute Analyst Workflow**: Take a message_id, load context, run the analyst workflow

## Implementation Tasks

### Task 1: Request Object Structure & Validation ✅ COMPLETED
- **File**: `types.ts`
- **Description**: Simple input schema with just message_id
- **Dependencies**: None ✅ MET
- **Deliverables**: ✅ ALL COMPLETED
  - Input schema: `{ message_id: string }`
  - Output schema for task completion status
  - TypeScript types inferred from schemas

### Task 2: Database Helper Functions
- **File**: `@buster/database` package
- **Description**: Helper functions to load context from message_id
- **Dependencies**: None
- **Deliverables**:
  - Message retrieval with chat/user context
  - Conversation history loading for the chat
  - User/organization context helpers

### Task 3: Runtime Context Setup Logic
- **File**: `analyst-agent-task.ts`
- **Description**: Derive runtime context from message_id
- **Dependencies**: Task 2 (Database helpers)
- **Deliverables**:
  - Load user, organization, data source from message context
  - Runtime context population for analyst workflow

### Task 4: Chat History Loading
- **File**: `analyst-agent-task.ts`
- **Description**: Load conversation history for the chat
- **Dependencies**: Task 2 (Database helpers)
- **Deliverables**:
  - Load all previous conversation history for the chat
  - Format history for analyst workflow input

### Task 5: Complete Implementation
- **File**: `analyst-agent-task.ts`
- **Description**: Integrate all components into the final task implementation
- **Dependencies**: Tasks 1-4
- **Deliverables**:
  - Complete task implementation using simplified schemas
  - Integration with database helpers and analyst workflow
  - Comprehensive error handling for the simplified flow

## Dependency Map

```
Task 1: Request Schema ◄── No dependencies
Task 2: Database Helpers ◄── No dependencies
Task 3: Runtime Context ◄── Depends on Task 2
Task 4: Chat History ◄── Depends on Task 2
Task 5: Complete Implementation ◄── Depends on Tasks 1-4
```

## Parallel Work Opportunities

### Team Assignment Suggestions

**Developer A** - Foundation:
- Task 1: Request Object Structure
- Task 2: Database Helper Functions

**Developer B** - Context & History:
- Task 3: Runtime Context Setup
- Task 4: Chat History Loading

**Developer C** - Integration:
- Task 5: Complete Implementation

## Technical Architecture

### Simplified Input Flow
```
message_id → Message Context → User/Chat Context → Conversation History → Analyst Workflow
```

### Core Logic Flow
```typescript
async function analystAgentTask(payload: { message_id: string }) {
  // 1. Load message with chat and user context
  const messageContext = await getMessageContext(payload.message_id);
  
  // 2. Setup runtime context for workflow
  const runtimeContext = await setupRuntimeContext(messageContext);
  
  // 3. Load conversation history for the chat
  const conversationHistory = await loadChatHistory(messageContext.chat.id);
  
  // 4. Execute analyst workflow
  const workflowInput = {
    prompt: messageContext.message.requestMessage,
    conversationHistory
  };
  
  await analystWorkflow.createRun().start({
    inputData: workflowInput,
    runtimeContext
  });
  
  // Workflow handles saving results back to the message
}
```

## Key Integration Points

1. **Database Operations**: All database work goes through `@buster/database` helpers
2. **Workflow Integration**: Uses existing `@packages/ai/src/workflows/analyst-workflow.ts`
3. **Message History**: Leverages `@packages/ai/src/utils/memory/` utilities
4. **Context Loading**: Message → Chat → User → Organization → DataSource chain

## Removed Complexity

The following features are now handled by the web server:
- ❌ Authentication token validation
- ❌ Asset loading (metrics/dashboards)
- ❌ Message editing/replacement
- ❌ Chat creation
- ❌ Multiple input scenarios (chat_id, asset_id, etc.)

## Success Criteria

- [x] **Task 1**: Simple request schema with message_id validation ✅ COMPLETED
- [ ] **Task 2**: Database helpers for context loading 
- [ ] **Task 3**: Runtime context setup from message data
- [ ] **Task 4**: Conversation history loading
- [ ] **Task 5**: Complete implementation with workflow integration
- [ ] Task receives message_id and executes successfully
- [ ] Loads complete user/chat context from message
- [ ] Retrieves conversation history for the chat
- [ ] Integrates with existing analyst workflow
- [ ] Workflow results are automatically saved to message
- [ ] Comprehensive error handling
- [ ] Full test coverage for the simplified flow

## Error Handling

Key error scenarios to handle:
- Message not found
- User context missing
- Chat context missing
- Database connection issues
- Workflow execution failures

## Performance Considerations

- **Simplified data loading**: Only one database lookup chain needed
- **No complex branching**: Single execution path
- **Workflow efficiency**: Let analyst workflow handle its own optimization
- **Error isolation**: Clear separation between setup errors and workflow errors