import type { LanguageModelV2ToolCall } from '@ai-sdk/provider';
import { wrapTraced } from 'braintrust';
import { canHandleNoSuchTool, repairWrongToolName } from './strategies/re-ask-strategy';
import { canHandleInvalidInput, repairInvalidInput } from './strategies/structured-output-strategy';
import type { RepairContext } from './types';

export async function repairToolCall(
  context: RepairContext
): Promise<LanguageModelV2ToolCall | null> {
  return wrapTraced(
    async () => {
      if (canHandleInvalidInput(context.error)) {
        console.info('Repairing invalid tool input', {
          toolName: context.toolCall.toolName,
          errorType: context.error.constructor.name,
          agentName: context.agentContext?.agentName,
        });
        return repairInvalidInput(context);
      }

      if (canHandleNoSuchTool(context.error)) {
        console.info('Repairing wrong tool name', {
          toolName: context.toolCall.toolName,
          errorType: context.error.constructor.name,
          agentName: context.agentContext?.agentName,
        });
        return repairWrongToolName(context);
      }

      console.warn('No repair strategy for error type', {
        errorType: context.error.constructor.name,
        errorMessage: context.error.message,
        toolName: context.toolCall.toolName,
      });
      return null;
    },
    { name: 'repairToolCall' }
  )();
}
