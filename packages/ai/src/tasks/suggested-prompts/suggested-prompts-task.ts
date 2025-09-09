import type { ModelMessage } from 'ai';
import { generateObject } from 'ai';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { GPT5Nano } from '../../llm';
import { DEFAULT_OPENAI_OPTIONS } from '../../llm/providers/gateway';

// Schema for LLM output
const SuggestedMessagesOutputSchema = z.object({
  report: z.array(z.string()).describe('Suggested prompts for generating reports'),
  dashboard: z.array(z.string()).describe('Suggested prompts for creating dashboards'),
  visualization: z.array(z.string()).describe('Suggested prompts for creating visualizations'),
  help: z.array(z.string()).describe('Suggested help prompts for getting assistance'),
});

export type SuggestedMessagesOutput = z.infer<typeof SuggestedMessagesOutputSchema>;

export interface GenerateSuggestedMessagesParams {
  chatHistory: ModelMessage[];
  databaseContext: string;
  userId: string;
}

/**
 * Load the system prompt from the text file
 */
function loadSystemPrompt(): string {
  try {
    const promptPath = join(__dirname, 'suggested-prompts-system-prompt.txt');
    return readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.warn('[GenerateSuggestedMessages] Failed to load system prompt file, using fallback');
    return `You are a business intelligence suggestion engine. Generate 3-5 relevant, actionable prompts for each category (report, dashboard, visualization, help) based on the user's data and chat history.`;
  }
}

/**
 * Generates contextual suggested messages based on chat history and database context
 */
export async function generateSuggestedMessages(
  params: GenerateSuggestedMessagesParams
): Promise<SuggestedMessagesOutput> {
  const { chatHistory, databaseContext, userId } = params;

  try {
    const baseSystemPrompt = loadSystemPrompt();
    
    // Combine system prompt with database context
    const systemPromptWithContext = baseSystemPrompt.replace('{{DOCUMENTATION}}', databaseContext);

    // Format chat history for the user message
    const chatHistoryText = chatHistory.length > 0 
      ? chatHistory
          .slice(-10) // Take last 10 messages to stay within token limits
          .map((msg, index) => {
            const role = msg.role.toUpperCase();
            const content = typeof msg.content === 'string' 
              ? msg.content 
              : JSON.stringify(msg.content);
            return `${index + 1}. ${role}: ${content}`;
          })
          .join('\n')
      : 'No chat history available';

    const userMessage = `Based on this chat history, generate suggested prompts:

<chat_history>
${chatHistoryText}
</chat_history>

Generate suggestions that are relevant to the conversation context and available data.`;

    const tracedGeneration = wrapTraced(
      async () => {
        const { object } = await generateObject({
          model: GPT5Nano,
          schema: SuggestedMessagesOutputSchema,
          prompt: userMessage,
          temperature: 1,
          maxOutputTokens: 2000,
          system: systemPromptWithContext,
          providerOptions: DEFAULT_OPENAI_OPTIONS,
        });

        return object;
      },
      {
        name: 'Generate Suggested Prompts',
        spanAttributes: {
          chatHistoryLength: chatHistory.length,
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
    console.error('[GenerateSuggestedMessages] Failed to generate suggestions:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'Unknown',
      chatHistoryLength: chatHistory.length,
      userId: userId,
    });

    // Return fallback suggestions on error
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