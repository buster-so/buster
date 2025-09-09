import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
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

    const tracedGeneration = wrapTraced(
      async () => {
        const result = await generateObject({
          model: openai('gpt-5-nano'),
          prompt: userMessage,
          temperature: 0.7,
          maxOutputTokens: 10000,
          system: systemPromptWithContext,
          schema: SuggestedMessagesOutputSchema,
          providerOptions: {
            gateway: {
              order: ['openai'],
              openai: {
                parallelToolCalls: false,
                reasoningEffort: 'minimal',
                verbosity: 'low',
              },
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
        spanAttributes: {
          chatHistoryLength: chatHistoryText.length,
          userId: userId,
        },
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

    // Ensure minimum of 2 suggestions per category
    Object.keys(validatedSuggestions).forEach((key) => {
      const categoryKey = key as keyof SuggestedMessagesOutput;
      if (validatedSuggestions[categoryKey].length < 2) {
        // Add fallback suggestions if we don't have enough
        const fallbacks = getFallbackSuggestions(categoryKey);
        validatedSuggestions[categoryKey] = [
          ...validatedSuggestions[categoryKey],
          ...fallbacks.slice(0, 2 - validatedSuggestions[categoryKey].length),
        ];
      }
    });

    return validatedSuggestions;
  } catch (error) {
    console.error('[GenerateSuggestedMessages] Failed to generate suggestions:', error);

    return {
      report: getFallbackSuggestions('report'),
      dashboard: getFallbackSuggestions('dashboard'),
      visualization: getFallbackSuggestions('visualization'),
      help: getFallbackSuggestions('help'),
    };
  }
}

/**
 * Provides fallback suggestions when AI generation fails or produces insufficient results
 */
function getFallbackSuggestions(category: keyof SuggestedMessagesOutput): string[] {
  const fallbacks = {
    report: [
      'Generate a monthly performance summary report',
      'Create a comparative analysis report for this quarter',
      'Show me a detailed breakdown of key metrics',
      'Analyze trends and patterns in recent data',
    ],
    dashboard: [
      'Create a key metrics overview dashboard',
      'Build a real-time performance monitoring dashboard',
      'Set up a weekly summary dashboard',
      'Design an executive summary dashboard',
    ],
    visualization: [
      'Show me a trend chart of recent activity',
      'Create a comparison chart between categories',
      'Display the top 10 items in a bar chart',
      'Generate a pie chart showing distribution',
    ],
    help: [
      'How do I create a new dashboard?',
      'What types of charts can I create?',
      'How do I filter my data?',
      'Show me tips for better data analysis',
    ],
  };

  return fallbacks[category] || [];
}
