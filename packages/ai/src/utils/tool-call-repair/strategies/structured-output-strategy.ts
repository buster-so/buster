import type { LanguageModelV2ToolCall } from '@ai-sdk/provider';
import { generateObject, InvalidToolInputError } from 'ai';
import { wrapTraced } from 'braintrust';
import { GPT5Mini, Sonnet4 } from '../../../llm';
import { DEFAULT_ANTHROPIC_OPTIONS, DEFAULT_OPENAI_OPTIONS } from '../../../llm/providers/gateway';
import { SEQUENTIAL_THINKING_TOOL_NAME } from '../../../tools/planning-thinking-tools/sequential-thinking-tool/sequential-thinking-tool';
import type { RepairContext } from '../types';

export function canHandleInvalidInput(error: Error): boolean {
  return error instanceof InvalidToolInputError;
}

function buildRepairPrompt(toolName: string, currentInput: unknown): string {
  // Special handling for sequentialThinking tool to preserve original thought content
  if (toolName === SEQUENTIAL_THINKING_TOOL_NAME) {
    return `You are repairing malformed tool arguments for the "sequentialThinking" tool.

The input below contains JSON formatting errors (e.g., XML tags, unclosed strings, etc.) but also contains the ORIGINAL THOUGHT CONTENT that must be preserved exactly.

Your task:
1. Extract the original semantic thought content from the malformed input
2. Do NOT analyze what went wrong with the formatting
3. Do NOT use the "thought" field to explain the malformation
4. The "thought" field must contain the ORIGINAL substantive thinking/analysis, not a description of the error
5. Fix any formatting issues while preserving the original meaning
6. Ensure the output matches the schema with proper "thought", "nextThoughtNeeded", and "thoughtNumber" fields

Malformed input:
${JSON.stringify(currentInput, null, 2)}`;
  }

  // Default repair prompt for other tools
  return `Fix these tool arguments to match the schema:\n${JSON.stringify(currentInput, null, 2)}`;
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
          model: GPT5Mini,
          providerOptions: DEFAULT_OPENAI_OPTIONS,
          schema: tool.inputSchema,
          maxOutputTokens: 10000,
          prompt: buildRepairPrompt(context.toolCall.toolName, currentInput),
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
