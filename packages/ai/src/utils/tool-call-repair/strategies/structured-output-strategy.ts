import type { LanguageModelV2ToolCall } from '@ai-sdk/provider';
import { InvalidToolInputError, generateObject } from 'ai';
import { wrapTraced } from 'braintrust';
import { Sonnet4 } from '../../../llm';
import type { RepairContext } from '../types';

export function canHandleInvalidInput(error: Error): boolean {
  return error instanceof InvalidToolInputError;
}

export async function repairInvalidInput(
  context: RepairContext
): Promise<LanguageModelV2ToolCall | null> {
  return wrapTraced(
    async () => {
      const tool = context.tools[context.toolCall.toolName as keyof typeof context.tools];

      if (!tool) {
        console.error(`Tool ${context.toolCall.toolName} not found`);
        return null;
      }

      if (!tool.inputSchema) {
        console.error(`Tool ${context.toolCall.toolName} has no input schema`);
        return null;
      }

      // Get the current input (could be string or object)
      let currentInput: unknown;
      if (typeof context.toolCall.input === 'string') {
        try {
          currentInput = JSON.parse(context.toolCall.input);
        } catch {
          // If it's not valid JSON, use it as-is (it might be a plain string)
          currentInput = context.toolCall.input;
        }
      } else {
        currentInput = context.toolCall.input || {};
      }

      try {
        const { object: repairedInput } = await generateObject({
          model: await Sonnet4,
          schema: tool.inputSchema,
          prompt: `Fix these tool arguments to match the schema:\n${JSON.stringify(currentInput, null, 2)}`,
          mode: 'json',
        });

        console.info('Successfully repaired tool arguments', {
          toolName: context.toolCall.toolName,
          originalInput: currentInput,
          repairedInput,
        });

        // Return repaired input as JSON string (SDK expects string for processing)
        return {
          ...context.toolCall,
          input: JSON.stringify(repairedInput),
        } as LanguageModelV2ToolCall;
      } catch (error) {
        console.error('Failed to repair tool input:', error);
        return null;
      }
    },
    { name: 'repairInvalidInput' }
  )();
}
