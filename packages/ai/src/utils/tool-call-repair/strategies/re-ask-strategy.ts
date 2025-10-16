import type { LanguageModelV2ToolCall } from '@ai-sdk/provider';
import { generateText, type ModelMessage, NoSuchToolError, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import {
  ANALYST_AGENT_NAME,
  ANALYST_ENGINEER_AGENT_NAME,
  THINK_AND_PREP_AGENT_NAME,
} from '../../../agents';
import { GPT5Mini, Sonnet4 } from '../../../llm';
import { DEFAULT_ANTHROPIC_OPTIONS, DEFAULT_OPENAI_OPTIONS } from '../../../llm/providers/gateway';
import type { RepairContext } from '../types';

export function canHandleNoSuchTool(error: Error): boolean {
  return NoSuchToolError.isInstance(error);
}

export async function repairWrongToolName(
  context: RepairContext
): Promise<LanguageModelV2ToolCall | null> {
  return wrapTraced(
    async () => {
      const errorMessage = buildErrorMessage(context);

      // Parse input if it's a string, to ensure API receives an object
      let toolCallInput: unknown = context.toolCall.input;
      if (typeof toolCallInput === 'string') {
        try {
          toolCallInput = JSON.parse(toolCallInput);
        } catch {
          // If parsing fails, keep it as is
        }
      }

      const healingMessages: ModelMessage[] = [
        ...context.messages,
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: context.toolCall.toolCallId,
              toolName: context.toolCall.toolName,
              input: toolCallInput,
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: context.toolCall.toolCallId,
              toolName: context.toolCall.toolName,
              output: {
                type: 'text',
                value: errorMessage,
              },
            },
          ],
        },
      ];

      try {
        const result = streamText({
          model: GPT5Mini,
          providerOptions: DEFAULT_OPENAI_OPTIONS,
          messages: healingMessages,
          tools: context.tools,
          maxOutputTokens: 10000,
          temperature: 0,
        });

        for await (const _ of result.textStream) {
          // We don't need to do anything with the text chunks,
          // just consume them to keep the stream flowing
        }

        // Find the first valid tool call
        const newToolCall = (await result.toolCalls).find((tc) => tc.toolName in context.tools);

        if (!newToolCall) {
          console.warn('Re-ask did not produce a valid tool call', {
            toolName: context.toolCall.toolName,
            availableTools: Object.keys(context.tools),
          });
          return null;
        }

        console.info('Successfully corrected tool call', {
          originalTool: context.toolCall.toolName,
          correctedTool: newToolCall.toolName,
        });

        // Return the input as JSON string (SDK expects string for processing)
        return {
          type: 'tool-call',
          toolCallType: 'function' as const,
          toolCallId: context.toolCall.toolCallId,
          toolName: newToolCall.toolName,
          input: JSON.stringify(newToolCall.input),
        } as LanguageModelV2ToolCall;
      } catch (error) {
        console.error('Failed to repair wrong tool name:', {
          error,
          toolName: context.toolCall.toolName,
        });
        return null;
      }
    },
    { name: 'repairWrongToolName' }
  )();
}

function buildErrorMessage(context: RepairContext): string {
  const { agentContext, toolCall } = context;

  if (!agentContext) {
    const availableTools = Object.keys(context.tools).join(', ');
    return `Tool "${toolCall.toolName}" is not available. Available tools: ${availableTools}`;
  }

  // Agent-specific messages
  switch (agentContext.agentName) {
    case ANALYST_AGENT_NAME:
      return `Tool "${toolCall.toolName}" is not available. Available tools: ${agentContext.availableTools.join(', ')}.
      
      The previous phase of the workflow was the think and prep phase that has access to the following tools:
      sequentialThinking, executeSql, respondWithoutAssetCreation, submitThoughts, messageUserClarifyingQuestion
      
      However, you don't have access to any of those tools at this moment.`;

    case THINK_AND_PREP_AGENT_NAME:
      return `Tool "${toolCall.toolName}" is not available. Available tools: ${agentContext.availableTools.join(', ')}.
      
      The next phase of the workflow will be the analyst that has access to the following tools:
      createMetrics, modifyMetrics, createDashboards, modifyDashboards, createReports, modifyReports, doneTool
      
      You'll be able to use those when they are available to you.`;

    case ANALYST_ENGINEER_AGENT_NAME:
      return `Tool "${toolCall.toolName}" is not available. Available tools: ${agentContext.availableTools.join(', ')}.
      
      Please use one of the available tools to complete your task.`;

    default:
      return `Tool "${toolCall.toolName}" is not available. Available tools: ${agentContext.availableTools.join(', ')}`;
  }
}
