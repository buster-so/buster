import { getUser } from '@buster/database/queries';
import { DEFAULT_USER_SUGGESTED_PROMPTS } from '@buster/database/schema-types';
import { generateObject } from 'ai';
import { currentSpan, wrapTraced } from 'braintrust';
import { z } from 'zod';
import { GPT5Nano } from '../../llm';
import SUGGESTED_PROMPTS_SYSTEM_PROMPT from './suggested-prompts-system-prompt.txt';

// Schema for LLM output
const SuggestedMessagesOutputSchema = z.object({
  report: z.array(z.string()).describe('Suggested prompts for generating reports'),
  dashboard: z.array(z.string()).describe('Suggested prompts for creating dashboards'),
  visualization: z.array(z.string()).describe('Suggested prompts for creating visualizations'),
  help: z.array(z.string()).describe('Suggested help prompts for getting assistance'),
});

export type SuggestedMessagesOutput = z.infer<typeof SuggestedMessagesOutputSchema>;

export interface GenerateSuggestedMessagesParams {
  chatHistoryText: string;
  databaseContext: string;
  userId: string;
}

/**
 * Get the system prompt template
 */
function getSystemPrompt(): string {
  return SUGGESTED_PROMPTS_SYSTEM_PROMPT;
}

/**
 * Generates contextual suggested messages based on chat history and database context
 */
export async function generateSuggestedMessages(
  params: GenerateSuggestedMessagesParams
): Promise<SuggestedMessagesOutput> {
  const { chatHistoryText, databaseContext, userId } = params;

  try {
    const baseSystemPrompt = getSystemPrompt();
    const systemPromptWithContext = baseSystemPrompt.replace('{{DOCUMENTATION}}', databaseContext);
    const userMessage = `Based on this chat history, generate suggested prompts:

##chat_history
${chatHistoryText}

Generate suggestions that are relevant to the conversation context and available data.`;

    const userInfo = await getUser({ id: userId });

    const tracedGeneration = wrapTraced(
      async () => {
        currentSpan().log({
          metadata: {
            userName: userInfo.name || 'Unknown',
            userEmail: userInfo.email,
            userId: userId,
            chatHistoryTextLength: chatHistoryText.length,
          },
        });

        const result = await generateObject({
          model: GPT5Nano,
          prompt: userMessage,
          maxOutputTokens: 3000,
          system: systemPromptWithContext,
          schema: SuggestedMessagesOutputSchema,
          providerOptions: {
            gateway: {
              order: ['openai'],
            },
            openai: {
              parallelToolCalls: false,
              reasoningEffort: 'minimal',
              verbosity: 'low',
            },
          },
        });

        if (!result.object) {
          throw new Error(`Model returned no object. Finish reason: ${result.finishReason}`);
        }

        return result.object;
      },
      {
        name: 'Generate Suggested Prompts',
      }
    );

    const suggestions = await tracedGeneration();

    // Validate and limit suggestions per category
    const validatedSuggestions: SuggestedMessagesOutput = {
      report: suggestions.report.slice(0, 4),
      dashboard: suggestions.dashboard.slice(0, 4),
      visualization: suggestions.visualization.slice(0, 4),
      help: suggestions.help.slice(0, 4),
    };

    // Ensure minimum of 1 suggestions per category
    Object.keys(validatedSuggestions).forEach((key) => {
      const categoryKey = key as keyof SuggestedMessagesOutput;
      if (validatedSuggestions[categoryKey].length < 1) {
        validatedSuggestions[categoryKey] =
          DEFAULT_USER_SUGGESTED_PROMPTS.suggestedPrompts[categoryKey];
      }
    });

    return validatedSuggestions;
  } catch (error) {
    console.error('[GenerateSuggestedMessages] Failed to generate suggestions:', error);
    throw error;
  }
}
