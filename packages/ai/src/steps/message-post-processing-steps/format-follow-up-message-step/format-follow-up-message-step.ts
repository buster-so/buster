import type { ModelMessage } from 'ai';
import { generateObject } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { DEFAULT_ANTHROPIC_OPTIONS } from '../../../llm/providers/gateway';
import { Sonnet4 } from '../../../llm/sonnet-4';

// Zod schemas first - following Zod-first approach
export const formatFollowUpMessageParamsSchema = z.object({
  userName: z.string().describe('User name for context'),
  flaggedIssues: z.string().describe('Issues that were flagged during analysis'),
  majorAssumptions: z
    .array(
      z.object({
        descriptiveTitle: z.string().describe('A clear, descriptive title for the assumption'),
        explanation: z
          .string()
          .describe('Detailed explanation of the assumption and its potential impact'),
        label: z.string().describe('Label indicating the nature and severity of the assumption'),
      })
    )
    .describe('List of major assumptions that need attention'),
  conversationHistory: z
    .array(z.custom<ModelMessage>())
    .optional()
    .describe('The conversation history'),
});

export const formatFollowUpMessageResultSchema = z.object({
  summaryMessage: z.string().describe('The formatted update message for the data team'),
  summaryTitle: z.string().describe('Short title for the update message'),
});

// Export types from schemas
export type FormatFollowUpMessageParams = z.infer<typeof formatFollowUpMessageParamsSchema>;
export type FormatFollowUpMessageResult = z.infer<typeof formatFollowUpMessageResultSchema>;

// LLM-compatible schema for generating update message
const generateUpdateMessageOutputSchema = z.object({
  title: z.string().describe('A concise title for the update message, 3-6 words long'),
  update_message: z
    .string()
    .describe('A simple and concise update about the new issues and assumptions'),
});

const followUpMessageInstructions = `
<intro>
- You are a specialized AI agent named Buster within an AI-powered data analyst system.
- The data team manages the system documentation and should be notified of major assumptions or issues encountered due to lack of documentation.
- The data team has already been notified of initial issues and assumptions.
- Your recent analysis was reviewed by an 'Evaluation Agent', which flagged additional assumptions made and issues encountered.
- Your job is to create an update message for the new issues and assumptions found in the most recent chat messages.
- Your role is to receive these new issues and assumptions, review them, and write a short, conversational reply for the data team's Slack thread.
- The data team will use this summary to understand the user's request, assumptions made, issues encountered, and areas needing clarification in the documentation.
- Your tasks:
  - Assess the existing alert that was sent to the data team.
  - Analyze the newly flagged assumptions and issues.
  - Provide a simple, direct summary message for the data team's Slack channel.
  - Provide a 3-6 word title for the summary message.
</intro>

<agent_loop>
Your process:
1. Start by thinking through the new issues and assumptions.
2. Continue thinking until you have thoroughly assessed them and planned your summary message and title.
3. Use the \`generateUpdateMessage\` tool to send the update.
</agent_loop>

<tool_use_rules>
- Follow the tool schema exactly, including all required parameters.
- Use the \`generateUpdateMessage\` tool to provide the update summary.
</tool_use_rules>

<output_format>
- Use the \`generateUpdateMessage\` tool to send an \`update_message\` and \`title\`.
  - Title: A 3-6 word header describing the key issues or assumptions (e.g., "No Referral IDs Found").
  - Update Message:
    - Start with the user's first name and a brief, accurate description of their follow-up request (e.g., "Kevin sent a follow up request to /"filter by the last 6 months/".").
    - Follow with a list of bullet points (each starting with "•") describing each assumption or issue and its implication.
    - Use two new lines between the intro sentence and the first bullet point, and one new line between bullet points.
    - Write in the first person as Buster, using 'I' to refer to yourself.
    - Use backticks for specific fields or calculations (e.g., \`sales.revenue\` or \`(# of orders delivered on or before due date) / (Total number of orders) * 100\`).
- Do not use bold, headers, or emojis in the title or summary.
- The title and summary should be written using a JSON string format.
</output_format>

<example>
- Summary Message: "Scott sent a followup request to change metric to show "total count of customers".\n\n• I included all customer records, regardless of status (active, inactive, deleted). If incorrect, this likely inflates the count."
- Title: "Customer Count Includes All Statuses"
</example>
`;

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral' } },
};

/**
 * Generate update message using LLM
 */
async function generateUpdateMessageWithLLM(
  userName: string,
  flaggedIssues: string,
  majorAssumptions: Array<{ descriptiveTitle: string; explanation: string; label: string }>,
  conversationHistory?: ModelMessage[]
): Promise<z.infer<typeof generateUpdateMessageOutputSchema>> {
  const contextMessage = `New issues and assumptions identified from the latest chat messages:

User: ${userName}


Issues Flagged: 
${flaggedIssues}


Major Assumptions Identified: 
${
  majorAssumptions.length > 0
    ? majorAssumptions.map((a) => `- ${a.descriptiveTitle}: ${a.explanation}`).join('\n\n')
    : 'No major assumptions identified'
}

${
  conversationHistory && conversationHistory.length > 0
    ? `\nChat History:
\`\`\`
${JSON.stringify(conversationHistory, null, 2)}
\`\`\``
    : ''
}

Generate a concise update message for the data team.`;

  const systemAndUserMessages: ModelMessage[] = [
    {
      role: 'system',
      content: followUpMessageInstructions,
      providerOptions: DEFAULT_CACHE_OPTIONS,
    },
    {
      role: 'user',
      content: contextMessage,
    },
  ];

  const { object } = await generateObject({
    model: Sonnet4,
    schema: generateUpdateMessageOutputSchema,
    messages: systemAndUserMessages,
    temperature: 0,
    maxOutputTokens: 10000,
    providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
  });

  return object;
}

/**
 * Main execution function for format follow-up message step
 */
export async function runFormatFollowUpMessageStep(
  params: FormatFollowUpMessageParams
): Promise<FormatFollowUpMessageResult> {
  try {
    // If no major assumptions, return empty result
    if (params.majorAssumptions.length === 0) {
      return {
        summaryMessage: '',
        summaryTitle: '',
      };
    }

    const tracedFollowUpMessage = wrapTraced(
      async () => {
        const result = await generateUpdateMessageWithLLM(
          params.userName,
          params.flaggedIssues,
          params.majorAssumptions,
          params.conversationHistory
        );
        return result;
      },
      {
        name: 'Format Follow-up Message',
      }
    );

    const updateResult = await tracedFollowUpMessage();

    return {
      summaryMessage: updateResult.update_message,
      summaryTitle: updateResult.title,
    };
  } catch (error) {
    console.error('[format-follow-up-message-step] Unexpected error:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // For other errors, throw a user-friendly message
    throw new Error('Unable to format the follow-up message. Please try again later.');
  }
}
