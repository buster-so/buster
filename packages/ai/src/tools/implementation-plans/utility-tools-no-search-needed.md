# No Search Needed Tool Implementation Plan

## Overview

Migrate the Rust `no_search_needed.rs` to TypeScript using Mastra framework. This tool signals that data search is not required for the current task.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/utility_tools/no_search_needed.rs`
- **Purpose**: Indicate that no data catalog search is needed
- **Input**: Reason for skipping search
- **Output**: Confirmation and state update
- **Key Features**:
  - State management
  - Workflow optimization
  - Search skip justification

## TypeScript Implementation

### Tool Definition

```typescript
export const noSearchNeededTool = createTool({
  id: 'no-search-needed',
  description: 'Signal that data catalog search is not required for the current task',
  inputSchema: z.object({
    reason: z.enum([
      'user_provided_data',
      'using_existing_context',
      'informational_request',
      'action_only_task',
      'already_searched',
      'other'
    ]).describe('Reason for skipping data search'),
    explanation: z.string().optional()
      .describe('Additional explanation for skipping search'),
    data_context: z.object({
      has_user_data: z.boolean().default(false),
      has_cached_results: z.boolean().default(false),
      previous_search_id: z.string().optional()
    }).optional()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    search_skipped: z.boolean(),
    reason_recorded: z.string(),
    workflow_optimized: z.boolean()
  }),
  execute: async ({ context }) => {
    return await skipDataSearch(context);
  },
});
```

### Core Implementation

```typescript
interface NoSearchNeededParams {
  reason: SkipReason;
  explanation?: string;
  data_context?: {
    has_user_data: boolean;
    has_cached_results: boolean;
    previous_search_id?: string;
  };
}

type SkipReason = 
  | 'user_provided_data'
  | 'using_existing_context'
  | 'informational_request'
  | 'action_only_task'
  | 'already_searched'
  | 'other';

const skipDataSearch = wrapTraced(
  async (params: NoSearchNeededParams) => {
    const { reason, explanation, data_context } = params;
    
    // Record the decision in agent state
    await agent.setState('data_search_skipped', true);
    await agent.setState('skip_search_reason', reason);
    
    if (explanation) {
      await agent.setState('skip_search_explanation', explanation);
    }
    
    // Set data context flags
    if (data_context) {
      await agent.setState('has_data_context', 
        data_context.has_user_data || data_context.has_cached_results
      );
      
      if (data_context.previous_search_id) {
        await agent.setState('using_previous_search', data_context.previous_search_id);
      }
    }
    
    // Log the decision for analytics
    await logSearchSkipDecision({
      reason,
      explanation,
      timestamp: new Date().toISOString(),
      session_id: agent.getSessionId()
    });
    
    // Format reason for recording
    const reasonMessage = formatSkipReason(reason, explanation);
    
    return {
      success: true,
      search_skipped: true,
      reason_recorded: reasonMessage,
      workflow_optimized: true
    };
  },
  { name: 'no-search-needed' }
);

function formatSkipReason(reason: SkipReason, explanation?: string): string {
  const reasonMessages: Record<SkipReason, string> = {
    user_provided_data: 'User provided specific data to work with',
    using_existing_context: 'Using existing data context from previous operations',
    informational_request: 'Request is informational and does not require data access',
    action_only_task: 'Task involves only actions without data analysis',
    already_searched: 'Data catalog was already searched in this session',
    other: explanation || 'Custom reason for skipping data search'
  };
  
  return reasonMessages[reason];
}

async function logSearchSkipDecision(decision: {
  reason: SkipReason;
  explanation?: string;
  timestamp: string;
  session_id: string;
}) {
  // This would integrate with analytics/monitoring system
  // For now, just log to agent state
  const skipHistory = await agent.getState('search_skip_history') || [];
  skipHistory.push(decision);
  await agent.setState('search_skip_history', skipHistory);
}

// Helper to determine if search should be skipped
export async function shouldSkipDataSearch(context: {
  user_message: string;
  has_attachments: boolean;
  previous_actions: string[];
  conversation_context: any;
}): Promise<{ skip: boolean; reason?: SkipReason }> {
  const { user_message, has_attachments, previous_actions, conversation_context } = context;
  
  // Check if user provided data directly
  if (has_attachments || user_message.includes('here is the data')) {
    return { skip: true, reason: 'user_provided_data' };
  }
  
  // Check if we already searched in this conversation
  const searchedRecently = previous_actions.some(action => 
    action.includes('search_data_catalog') && 
    Date.now() - new Date(action).getTime() < 5 * 60 * 1000 // Within 5 minutes
  );
  
  if (searchedRecently) {
    return { skip: true, reason: 'already_searched' };
  }
  
  // Check if this is an informational request
  const informationalKeywords = [
    'what is', 'how does', 'explain', 'tell me about',
    'why', 'when should', 'best practices'
  ];
  
  const isInformational = informationalKeywords.some(keyword => 
    user_message.toLowerCase().includes(keyword)
  );
  
  if (isInformational && !user_message.toLowerCase().includes('data')) {
    return { skip: true, reason: 'informational_request' };
  }
  
  // Check if we have sufficient context
  if (conversation_context?.has_loaded_datasets) {
    return { skip: true, reason: 'using_existing_context' };
  }
  
  return { skip: false };
}

// Utility to validate skip decision
export const validateSearchSkipTool = createTool({
  id: 'validate-search-skip',
  description: 'Validate that skipping data search was appropriate',
  inputSchema: z.object({
    task_description: z.string(),
    skip_reason: z.string(),
    task_completed_successfully: z.boolean()
  }),
  outputSchema: z.object({
    decision_valid: z.boolean(),
    confidence_score: z.number().min(0).max(1),
    recommendation: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { task_description, skip_reason, task_completed_successfully } = context;
    
    // Simple validation logic
    let confidence = 0.8;
    let valid = true;
    let recommendation: string | undefined;
    
    // If task failed, decision might have been wrong
    if (!task_completed_successfully) {
      confidence = 0.3;
      valid = false;
      recommendation = 'Consider searching data catalog for failed tasks';
    }
    
    // Check if task description suggests data need
    const dataKeywords = ['analyze', 'report', 'metrics', 'dashboard', 'chart'];
    const needsData = dataKeywords.some(kw => 
      task_description.toLowerCase().includes(kw)
    );
    
    if (needsData && skip_reason === 'informational_request') {
      confidence = 0.5;
      recommendation = 'Task appears to need data despite being classified as informational';
    }
    
    return {
      decision_valid: valid,
      confidence_score: confidence,
      recommendation
    };
  }
});
```

## Testing Strategy

### Unit Tests

```typescript
describe('NoSearchNeededTool', () => {
  test('skips search for user provided data', async () => {
    const result = await noSearchNeededTool.execute({
      context: {
        reason: 'user_provided_data',
        data_context: {
          has_user_data: true,
          has_cached_results: false
        }
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.search_skipped).toBe(true);
    expect(result.reason_recorded).toContain('User provided');
  });
  
  test('records explanation for other reason', async () => {
    const explanation = 'Using pre-computed results from external system';
    
    const result = await noSearchNeededTool.execute({
      context: {
        reason: 'other',
        explanation
      }
    });
    
    expect(result.reason_recorded).toBe(explanation);
  });
  
  test('links to previous search', async () => {
    const previousSearchId = 'search_123';
    
    const result = await noSearchNeededTool.execute({
      context: {
        reason: 'already_searched',
        data_context: {
          has_user_data: false,
          has_cached_results: true,
          previous_search_id: previousSearchId
        }
      }
    });
    
    expect(result.success).toBe(true);
    expect(mockAgent.setState).toHaveBeenCalledWith(
      'using_previous_search',
      previousSearchId
    );
  });
});

describe('Search Skip Decision Helper', () => {
  test('detects user provided data', async () => {
    const result = await shouldSkipDataSearch({
      user_message: 'Here is the data I want you to analyze: ...',
      has_attachments: false,
      previous_actions: [],
      conversation_context: {}
    });
    
    expect(result.skip).toBe(true);
    expect(result.reason).toBe('user_provided_data');
  });
  
  test('detects recent search', async () => {
    const result = await shouldSkipDataSearch({
      user_message: 'Now create a chart',
      has_attachments: false,
      previous_actions: [
        `search_data_catalog completed at ${new Date().toISOString()}`
      ],
      conversation_context: {}
    });
    
    expect(result.skip).toBe(true);
    expect(result.reason).toBe('already_searched');
  });
  
  test('identifies informational requests', async () => {
    const result = await shouldSkipDataSearch({
      user_message: 'What is the best practice for creating dashboards?',
      has_attachments: false,
      previous_actions: [],
      conversation_context: {}
    });
    
    expect(result.skip).toBe(true);
    expect(result.reason).toBe('informational_request');
  });
});
```

## Implementation Priority

**Low** - Simple utility tool, implement after core functionality.

## Estimated Complexity

**Very Low** - Simple state management and decision logic.

## 1000x Speed Implementation Time

**5 minutes** - Straightforward skip logic and state updates.