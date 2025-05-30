import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

type SkipReason =
  | 'user_provided_data'
  | 'using_existing_context'
  | 'informational_request'
  | 'action_only_task'
  | 'already_searched'
  | 'other';

interface NoSearchNeededParams {
  reason: SkipReason;
  explanation?: string;
  data_context?: {
    has_user_data: boolean;
    has_cached_results: boolean;
    previous_search_id?: string;
  };
}

interface NoSearchNeededResult {
  success: boolean;
  search_skipped: boolean;
  reason_recorded: string;
  workflow_optimized: boolean;
}

// Simple state management for demonstration
// In production, this would integrate with the agent's state management system
class SearchStateManager {
  private static state = new Map<string, unknown>();

  static setState(key: string, value: unknown): void {
    this.state.set(key, value);
  }

  static getState(key: string): unknown {
    return this.state.get(key);
  }

  static getSessionId(): string {
    return 'session_' + Date.now();
  }
}

export const noSearchNeededTool = createTool({
  id: 'no-search-needed',
  description: 'Signal that data catalog search is not required for the current task',
  inputSchema: z.object({
    reason: z
      .enum(['user_provided_data', 'using_existing_context', 'informational_request', 'action_only_task', 'already_searched', 'other'])
      .describe('Reason for skipping data search'),
    explanation: z.string().optional().describe('Additional explanation for skipping search'),
    data_context: z
      .object({
        has_user_data: z.boolean().default(false),
        has_cached_results: z.boolean().default(false),
        previous_search_id: z.string().optional(),
      })
      .optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    search_skipped: z.boolean(),
    reason_recorded: z.string(),
    workflow_optimized: z.boolean(),
  }),
  execute: async ({ context }) => {
    return await skipDataSearch(context as NoSearchNeededParams);
  },
});

const skipDataSearch = wrapTraced(
  async (params: NoSearchNeededParams): Promise<NoSearchNeededResult> => {
    const { reason, explanation, data_context } = params;

    // Record the decision in agent state
    SearchStateManager.setState('data_search_skipped', true);
    SearchStateManager.setState('skip_search_reason', reason);

    if (explanation) {
      SearchStateManager.setState('skip_search_explanation', explanation);
    }

    // Set data context flags
    if (data_context) {
      SearchStateManager.setState('has_data_context', data_context.has_user_data || data_context.has_cached_results);

      if (data_context.previous_search_id) {
        SearchStateManager.setState('using_previous_search', data_context.previous_search_id);
      }
    }

    // Log the decision for analytics
    await logSearchSkipDecision({
      reason,
      explanation,
      timestamp: new Date().toISOString(),
      session_id: SearchStateManager.getSessionId(),
    });

    // Format reason for recording
    const reasonMessage = formatSkipReason(reason, explanation);

    return {
      success: true,
      search_skipped: true,
      reason_recorded: reasonMessage,
      workflow_optimized: true,
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
    other: explanation || 'Custom reason for skipping data search',
  };

  return reasonMessages[reason];
}

async function logSearchSkipDecision(decision: {
  reason: SkipReason;
  explanation?: string;
  timestamp: string;
  session_id: string;
}): Promise<void> {
  // This would integrate with analytics/monitoring system
  // For now, just log to agent state
  const skipHistory = (SearchStateManager.getState('search_skip_history') as unknown[]) || [];
  skipHistory.push(decision);
  SearchStateManager.setState('search_skip_history', skipHistory);
}

// Helper to determine if search should be skipped
export async function shouldSkipDataSearch(context: {
  user_message: string;
  has_attachments: boolean;
  previous_actions: string[];
  conversation_context: unknown;
}): Promise<{ skip: boolean; reason?: SkipReason }> {
  const { user_message, has_attachments, previous_actions, conversation_context } = context;

  // Check if user provided data directly
  if (has_attachments || user_message.includes('here is the data')) {
    return { skip: true, reason: 'user_provided_data' };
  }

  // Check if we already searched in this conversation
  const searchedRecently = previous_actions.some(
    (action) => action.includes('search_data_catalog') && Date.now() - new Date(action).getTime() < 5 * 60 * 1000 // Within 5 minutes
  );

  if (searchedRecently) {
    return { skip: true, reason: 'already_searched' };
  }

  // Check if this is an informational request
  const informationalKeywords = ['what is', 'how does', 'explain', 'tell me about', 'why', 'when should', 'best practices'];

  const isInformational = informationalKeywords.some((keyword) => user_message.toLowerCase().includes(keyword));

  if (isInformational && !user_message.toLowerCase().includes('data')) {
    return { skip: true, reason: 'informational_request' };
  }

  // Check if we have sufficient context
  if (conversation_context && typeof conversation_context === 'object' && 'has_loaded_datasets' in conversation_context) {
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
    task_completed_successfully: z.boolean(),
  }),
  outputSchema: z.object({
    decision_valid: z.boolean(),
    confidence_score: z.number().min(0).max(1),
    recommendation: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { task_description, skip_reason, task_completed_successfully } = context as {
      task_description: string;
      skip_reason: string;
      task_completed_successfully: boolean;
    };

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
    const needsData = dataKeywords.some((kw) => task_description.toLowerCase().includes(kw));

    if (needsData && skip_reason === 'informational_request') {
      confidence = 0.5;
      recommendation = 'Task appears to need data despite being classified as informational';
    }

    return {
      decision_valid: valid,
      confidence_score: confidence,
      recommendation,
    };
  },
});