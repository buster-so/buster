import { updateMessageEntries } from '@buster/database/queries';
import type { ToolCallOptions } from 'ai';
import {
  getOptimisticValue,
  OptimisticJsonParser,
} from '../../../utils/streaming/optimistic-json-parser';
import type { ExecuteSqlContext, ExecuteSqlInput, ExecuteSqlState } from './execute-sql';
import {
  createExecuteSqlRawLlmMessageEntry,
  createExecuteSqlReasoningEntry,
} from './helpers/execute-sql-transform-helper';

// Type-safe key extraction from the schema
const STATEMENTS_KEY = 'statements' as const satisfies keyof ExecuteSqlInput;

export function createExecuteSqlDelta(state: ExecuteSqlState, context: ExecuteSqlContext) {
  return async function executeSqlDelta(
    options: { inputTextDelta: string } & ToolCallOptions
  ): Promise<void> {
    // Accumulate the delta to the args
    state.args = (state.args || '') + options.inputTextDelta;

    // Use optimistic parsing to extract values even from incomplete JSON
    const parseResult = OptimisticJsonParser.parse(state.args);

    // Extract statements from the optimistically parsed values
    const rawStatements = getOptimisticValue<unknown>(
      parseResult.extractedValues,
      STATEMENTS_KEY,
      []
    );

    // Ensure statements is an array
    let statements: string[] = [];
    if (Array.isArray(rawStatements)) {
      statements = rawStatements.filter((s): s is string => typeof s === 'string');
    } else if (typeof rawStatements === 'string') {
      // Handle case where statements might be a JSON string
      try {
        const parsed = JSON.parse(rawStatements);
        if (Array.isArray(parsed)) {
          statements = parsed.filter((s): s is string => typeof s === 'string');
        }
      } catch {
        // If parsing fails, treat as single statement
        statements = [rawStatements];
      }
    }

    // Update state with parsed statements
    if (statements.length > 0) {
      state.statements = statements;
    }

    // Update reasoning entry with current state (but keep status as loading)
    const reasoningEntry = createExecuteSqlReasoningEntry(state, options.toolCallId);
    const rawLlmMessage = createExecuteSqlRawLlmMessageEntry(state, options.toolCallId);

    const messagesToSave: Parameters<typeof updateMessageEntries>[0] = {
      messageId: context.messageId,
    };

    if (reasoningEntry) {
      messagesToSave.reasoningMessages = [reasoningEntry];
    }

    if (rawLlmMessage) {
      messagesToSave.rawLlmMessages = [rawLlmMessage];
    }

    if (messagesToSave.reasoningMessages || messagesToSave.rawLlmMessages) {
      try {
        await updateMessageEntries(messagesToSave);
      } catch (error) {
        console.error('[execute-sql] Failed to update entries during delta:', {
          messageId: context.messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };
}
