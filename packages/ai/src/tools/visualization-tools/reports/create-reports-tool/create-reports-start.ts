import type { ToolCallOptions } from 'ai';
import type { CreateReportsContext, CreateReportsState } from './create-reports-tool';

export function createReportsStart(_context: CreateReportsContext, state: CreateReportsState) {
  return async (options: ToolCallOptions) => {
    // Reset state for new tool call to prevent contamination from previous calls
    state.toolCallId = options.toolCallId;
    state.argsText = undefined;
    state.files = [];
    state.startTime = Date.now();
    state.responseMessagesCreated = new Set<string>();
  };
}
