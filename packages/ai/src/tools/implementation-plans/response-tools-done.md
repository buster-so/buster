# Done Tool Implementation Plan

## Overview

Migrate the Rust `done.rs` to TypeScript using Mastra framework. This is a simple tool that signals task completion and workflow termination.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/response_tools/done.rs`
- **Purpose**: Signal that the agent has completed all requested tasks
- **Input**: Completion message (optional)
- **Output**: Success status and final message
- **Key Features**:
  - Workflow termination signal
  - State cleanup
  - Final response formatting
  - Agent session completion

## TypeScript Implementation

### Tool Definition

```typescript
export const doneTool = createTool({
  id: 'done',
  description: 'Signal completion of all requested tasks and end the workflow',
  inputSchema: z.object({
    message: z.string().optional()
      .describe('Optional completion message to display to the user'),
    summary: z.string().optional()
      .describe('Optional summary of completed work'),
    final_artifacts: z.array(z.object({
      type: z.enum(['dashboard', 'metric', 'report', 'analysis']),
      id: z.string().uuid(),
      title: z.string(),
      description: z.string().optional()
    })).optional().describe('List of artifacts created during the session')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    session_ended: z.boolean(),
    artifacts_created: z.number(),
    session_duration: z.number().describe('Session duration in milliseconds')
  }),
  execute: async ({ context }) => {
    return await signalCompletion(context);
  },
});
```

### Dependencies Required

```typescript
import { wrapTraced } from 'braintrust';
import { agent } from '@agents/context';
```

### Core Implementation

```typescript
interface DoneParams {
  message?: string;
  summary?: string;
  final_artifacts?: Artifact[];
}

interface Artifact {
  type: 'dashboard' | 'metric' | 'report' | 'analysis';
  id: string;
  title: string;
  description?: string;
}

const signalCompletion = wrapTraced(
  async (params: DoneParams) => {
    const startTime = await agent.getSessionStartTime();
    const currentTime = Date.now();
    const sessionDuration = currentTime - startTime;
    
    // Get final artifacts count
    const artifactsCreated = params.final_artifacts?.length || 0;
    
    // Prepare completion message
    const defaultMessage = artifactsCreated > 0
      ? `Task completed successfully. Created ${artifactsCreated} artifacts.`
      : 'Task completed successfully.';
      
    const finalMessage = params.message || defaultMessage;
    
    // Add summary if provided
    let completeMessage = finalMessage;
    if (params.summary) {
      completeMessage += `\n\nSummary: ${params.summary}`;
    }
    
    // List artifacts if any were created
    if (params.final_artifacts && params.final_artifacts.length > 0) {
      completeMessage += '\n\nCreated artifacts:';
      for (const artifact of params.final_artifacts) {
        completeMessage += `\n- ${artifact.type}: ${artifact.title}`;
        if (artifact.description) {
          completeMessage += ` - ${artifact.description}`;
        }
      }
    }
    
    // Update agent state to indicate completion
    await agent.setState('workflow_completed', true);
    await agent.setState('completion_time', new Date().toISOString());
    await agent.setState('session_duration', sessionDuration);
    await agent.setState('final_message', completeMessage);
    
    // Mark session as ended
    await agent.endSession();
    
    return {
      success: true,
      message: completeMessage,
      session_ended: true,
      artifacts_created: artifactsCreated,
      session_duration: sessionDuration
    };
  },
  { name: 'done' }
);
```

### Agent State Management

```typescript
// Helper functions for agent state management
class AgentContext {
  private sessionData: Map<string, any> = new Map();
  private sessionStartTime: number;
  
  constructor() {
    this.sessionStartTime = Date.now();
  }
  
  async setState(key: string, value: any): Promise<void> {
    this.sessionData.set(key, value);
    // Persist to storage if needed
    await this.persistState(key, value);
  }
  
  async getState(key: string): Promise<any> {
    return this.sessionData.get(key);
  }
  
  async getSessionStartTime(): Promise<number> {
    return this.sessionStartTime;
  }
  
  async endSession(): Promise<void> {
    // Cleanup resources
    await this.cleanupSession();
    
    // Mark session as complete
    await this.setState('session_active', false);
  }
  
  private async persistState(key: string, value: any): Promise<void> {
    // Implementation would depend on storage backend
    // Could be database, Redis, or in-memory store
  }
  
  private async cleanupSession(): Promise<void> {
    // Cleanup temporary resources
    // Close database connections
    // Clear temporary files
    // Cancel pending operations
  }
}
```

### Session Summary Generation

```typescript
async function generateSessionSummary(): Promise<string> {
  const createdMetrics = await agent.getState('created_metrics') || [];
  const createdDashboards = await agent.getState('created_dashboards') || [];
  const executedQueries = await agent.getState('executed_queries') || [];
  
  let summary = 'Session Summary:\n';
  
  if (createdMetrics.length > 0) {
    summary += `- Created ${createdMetrics.length} metrics\n`;
  }
  
  if (createdDashboards.length > 0) {
    summary += `- Created ${createdDashboards.length} dashboards\n`;
  }
  
  if (executedQueries.length > 0) {
    summary += `- Executed ${executedQueries.length} data queries\n`;
  }
  
  const totalArtifacts = createdMetrics.length + createdDashboards.length;
  if (totalArtifacts === 0) {
    summary += '- No artifacts were created (analysis or information request)\n';
  }
  
  return summary;
}
```

### Enhanced Tool with Auto-Summary

```typescript
export const doneToolWithSummary = createTool({
  id: 'done-with-summary',
  description: 'Signal completion with automatic session summary generation',
  inputSchema: z.object({
    message: z.string().optional(),
    include_auto_summary: z.boolean().default(true)
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    session_ended: z.boolean(),
    artifacts_created: z.number(),
    session_duration: z.number(),
    auto_summary: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { message, include_auto_summary = true } = context;
    
    let autoSummary: string | undefined;
    if (include_auto_summary) {
      autoSummary = await generateSessionSummary();
    }
    
    const result = await signalCompletion({
      message,
      summary: autoSummary
    });
    
    return {
      ...result,
      auto_summary: autoSummary
    };
  },
});
```

## Testing Strategy

### Unit Tests

```typescript
describe('DoneTool', () => {
  beforeEach(() => {
    mockAgent.reset();
    mockAgent.getSessionStartTime.mockReturnValue(Date.now() - 60000); // 1 minute ago
  });
  
  test('signals completion successfully', async () => {
    const result = await doneTool.execute({
      context: { message: 'All tasks completed successfully' }
    });
    
    expect(result.success).toBe(true);
    expect(result.session_ended).toBe(true);
    expect(result.message).toBe('All tasks completed successfully');
    expect(result.session_duration).toBeGreaterThan(0);
  });
  
  test('includes artifacts in completion message', async () => {
    const artifacts = [
      {
        type: 'dashboard' as const,
        id: '123',
        title: 'Sales Dashboard',
        description: 'Monthly sales overview'
      }
    ];
    
    const result = await doneTool.execute({
      context: { 
        message: 'Created dashboard',
        final_artifacts: artifacts
      }
    });
    
    expect(result.artifacts_created).toBe(1);
    expect(result.message).toContain('Sales Dashboard');
  });
  
  test('calculates session duration correctly', async () => {
    const startTime = Date.now() - 120000; // 2 minutes ago
    mockAgent.getSessionStartTime.mockReturnValue(startTime);
    
    const result = await doneTool.execute({
      context: { message: 'Done' }
    });
    
    expect(result.session_duration).toBeGreaterThan(100000); // ~2 minutes
    expect(result.session_duration).toBeLessThan(130000);
  });
  
  test('generates default message when none provided', async () => {
    const result = await doneTool.execute({
      context: {}
    });
    
    expect(result.message).toBe('Task completed successfully.');
  });
});
```

### Integration Tests

```typescript
describe('DoneTool Integration', () => {
  test('properly ends agent session', async () => {
    await doneTool.execute({
      context: { message: 'Integration test completion' }
    });
    
    expect(mockAgent.endSession).toHaveBeenCalled();
    expect(mockAgent.setState).toHaveBeenCalledWith('workflow_completed', true);
    expect(mockAgent.setState).toHaveBeenCalledWith('session_active', false);
  });
  
  test('persists completion state', async () => {
    const completionTime = new Date().toISOString();
    
    await doneTool.execute({
      context: { message: 'State persistence test' }
    });
    
    expect(mockAgent.setState).toHaveBeenCalledWith(
      'completion_time',
      expect.any(String)
    );
  });
});
```

## Implementation Dependencies

### New TypeScript Packages

- None required (uses existing Mastra and agent infrastructure)

### Missing from TypeScript

1. **Agent State Management**: Need persistent session state storage
2. **Session Management**: Need session lifecycle management
3. **Artifact Tracking**: Need to track created artifacts across tools

## Implementation Priority

**Low** - Simple tool, implement after core functionality is complete.

## Estimated Complexity

**Very Low** - Straightforward state management and message formatting.

## Notes

- This tool serves as a good template for simple tools
- Should integrate with session persistence system
- Consider adding telemetry/analytics for session completion
- Could be enhanced with user satisfaction feedback
- May want to integrate with notification systems
- Auto-summary generation could use LLM for better formatting
- Should handle edge cases like incomplete sessions gracefully