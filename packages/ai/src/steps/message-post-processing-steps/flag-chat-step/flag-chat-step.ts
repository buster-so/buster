import type { PermissionedDataset } from '@buster/access-controls';
import type { ModelMessage } from 'ai';
import { generateObject } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { DEFAULT_ANTHROPIC_OPTIONS } from '../../../llm/providers/gateway';
import { Sonnet4 } from '../../../llm/sonnet-4';
import { MessageHistorySchema } from '../../../utils/memory/types';

// Zod schemas first - following Zod-first approach
export const flagChatStepParamsSchema = z.object({
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('User name for context'),
  datasets: z.array(z.custom<PermissionedDataset>()).describe('Available datasets'),
  dataSourceSyntax: z.string().describe('SQL dialect for the data source'),
  organizationDocs: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        content: z.string(),
        type: z.string(),
        updatedAt: z.string(),
      })
    )
    .optional()
    .describe('Organization documentation'),
  analystInstructions: z.string().optional().describe('Organization analyst instructions'),
});

export const flagChatStepResultSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('flagChat'),
    summaryMessage: z.string().describe('Summary message for the data team'),
    summaryTitle: z.string().describe('Short title for the summary'),
  }),
  z.object({
    type: z.literal('noIssuesFound'),
    message: z.string().describe('Confirmation message that no issues were found'),
  }),
]);

// Export types from schemas
export type FlagChatStepParams = z.infer<typeof flagChatStepParamsSchema>;
export type FlagChatStepResult = z.infer<typeof flagChatStepResultSchema>;

// Schema for what the LLM returns - using simple object instead of discriminated union
const flagChatStepLLMOutputSchema = z.object({
  type: z.enum(['flagChat', 'noIssuesFound']).describe('Type of result'),
  summary_message: z
    .string()
    .optional()
    .describe('Summary message for the data team (only if flagChat)'),
  summary_title: z.string().optional().describe('Short title for the summary (only if flagChat)'),
  message: z.string().optional().describe('Confirmation message (only if noIssuesFound)'),
});

// Template function that returns the system prompt
const getFlagChatSystemMessage = (): string => `
<intro>
- You are a specialized AI agent within the Buster system, an AI-powered data analyst platform.
- Your role is to review the chat history between Buster and the user, identify signs of user frustration or issues, and flag chats for review by the data team.
- The user only sees the final response and delivered assets (e.g., charts, dashboards), not intermediate steps or errors.
- Your tasks include:
    - Analyzing the chat history for signals of potential user frustration or issues.
    - Flagging chats that meet the criteria for review.
    - Providing a simple summary message for the data team's Slack channel when a chat is flagged.
</intro>

<event_stream>
You will receive a chronological event stream containing:
1. User messages: Current and past requests.
2. Tool actions: Results from tool executions.
3. sequentialThinking thoughts: Buster's reasoning, thoughts, and decisions.
4. Other miscellaneous system events.
</event_stream>

<agent_loop>
You operate in a loop:
1. Start by reviewing the chat history for signals of user frustration or issues.
2. Continue reviewing until you have thoroughly assessed the chat.
3. If signals are detected, use the \`flagChat\` tool to flag the chat and provide a summary message.
4. If no signals are detected, use the \`noIssuesFound\` tool.
</agent_loop>

<tool_use_rules>
- Follow tool schemas exactly, including all required parameters.
- Use the \`flagChat\` tool when signals are detected, providing a title and summary message.
- Use the \`noIssuesFound\` tool if no issues are detected.
</tool_use_rules>

<signals_to_detect>
Look for these signals indicating user frustration or issues:
1. No final answer or results provided to the user.
2. Results returned were empty, zero, or null.
3. Errors prevented Buster from fulfilling the request.
4. Final response did not fully address the request or seemed forced.
5. Uncertainty or confusion in Buster's internal thoughts.
6. Final response indicates incomplete fulfillment of the request.
7. Signs of incomplete work or unresolved issues in the final response or assets.
8. Major assumptions in the final response or assets that could lead to significantly wrong results.
</signals_to_detect>

<identification_guidelines>
- Review user messages to understand requests and expectations.
- Check if Buster provided a final answer or results.
- Examine results for emptiness, zero, or null values.
- Assess if the final response fully addresses the request, noting any significant assumptions.
- Analyze Buster's thoughts for uncertainty or confusion.
- Check for unresolved issues or incomplete tasks.
- Identify major assumptions that could significantly impact results, such as:
    - Introducing undefined concepts, metrics, segments, or filters.
    - Choosing between similar fields or methods without clear guidance.
    - Making decisions based on incomplete documentation.
    - Assumptions where errors could substantially alter outcomes.
- Consider errors only if they affect the final response or assets.
</identification_guidelines>

<flagging_criteria>
Flag the chat if any of these conditions are met:
- No final answer or results provided.
- Results were empty, zero, or null (even if explained).
- Errors prevented fulfilling the request.
- Final response did not fully address the request or seemed forced.
- Significant uncertainty or confusion in Buster's thoughts.
- Final response indicated incomplete fulfillment.
- Signs of incomplete work.
- Major assumptions could lead to significantly wrong results.
</flagging_criteria>

<output_format>
- If flagging the chat, return a flagChat response with summary and title.
    - Include a 3-6 word title for the summary message.
    - Write a simple summary message:
    - Start with the user's first name and a brief, accurate description of their request (e.g., "Kevin requested a "total count of customers"").
    - Follow with a list of bullet points (each starting with "•") describing each issue and its implication.
    - Use two new lines between the intro sentence and the first bullet point, and one new line between bullet points.
    - Write in the first person as Buster, using 'I' to refer to yourself.
    - Use backticks for specific fields or calculations (e.g., \`sales.revenue\` or \`(# of orders delivered on or before due date) / (Total number of orders) * 100\`).
    - Do not use bold, headers, or emojis in the title or summary.
    - The title and summary should be written using a JSON string format.
- Example of flagChat response:
    - type: "flagChat"
    - summary_message: "Nate requested "recent returns for Retail Ready customers with Canadian shipping addresses".\n\n- Found no matching records.\n- The conversation history doesn't show a final response was sent. Likely encountered an error."
    - summary_title: "No Final Response Sent"
- If no issues, return a noIssuesFound response with a confirmation message.
</output_format>
`;

const createDatasetSystemMessage = (datasets: string): string => {
  return `<dataset_context>
${datasets}
</dataset_context>`;
};

/**
 * Convert datasets to a concatenated string for prompts
 */
function concatenateDatasets(datasets: PermissionedDataset[]): string {
  const validDatasets = datasets.filter(
    (dataset) => dataset.ymlContent !== null && dataset.ymlContent !== undefined
  );

  if (validDatasets.length === 0) {
    return 'No dataset context available.';
  }

  return validDatasets.map((dataset) => dataset.ymlContent).join('\n---\n');
}

/**
 * Generates a flag chat analysis using the LLM with structured output
 */
async function generateFlagChatWithLLM(
  conversationHistory: ModelMessage[] | undefined,
  userName: string,
  datasets: PermissionedDataset[],
  organizationDocs?: Array<{
    id: string;
    name: string;
    content: string;
    type: string;
    updatedAt: string;
  }>,
  analystInstructions?: string
): Promise<FlagChatStepResult> {
  try {
    // Prepare messages for the LLM
    const messages: ModelMessage[] = [];

    // Add dataset context as system message
    const datasetsYaml = concatenateDatasets(datasets);
    messages.push({
      role: 'system',
      content: createDatasetSystemMessage(datasetsYaml),
    });

    // Add organization docs if available
    if (organizationDocs && organizationDocs.length > 0) {
      const docsContent = organizationDocs
        .map((doc) => `### ${doc.name}\n${doc.content}`)
        .join('\n\n---\n\n');
      messages.push({
        role: 'system',
        content: `<organization_documentation>
${docsContent}
</organization_documentation>`,
      });
    }

    // Add analyst instructions if available
    if (analystInstructions) {
      messages.push({
        role: 'system',
        content: `<analyst_instructions>
${analystInstructions}
</analyst_instructions>`,
      });
    }

    // Add main system prompt
    messages.push({
      role: 'system',
      content: getFlagChatSystemMessage(),
    });

    // Add conversation history for analysis
    if (conversationHistory && conversationHistory.length > 0) {
      const chatHistoryText = JSON.stringify(conversationHistory, null, 2);
      messages.push({
        role: 'system',
        content: `Here is the chat history to analyze:

User: ${userName}

Chat History:
\`\`\`
${chatHistoryText}
\`\`\``,
      });
    } else {
      messages.push({
        role: 'system',
        content: `User: ${userName}

No conversation history available for analysis.`,
      });
    }

    // Add user prompt
    messages.push({
      role: 'user',
      content:
        'Please analyze this conversation history for potential user frustration or issues that should be flagged for review.',
    });

    const tracedFlagChatGeneration = wrapTraced(
      async () => {
        const { object } = await generateObject({
          model: Sonnet4,
          schema: flagChatStepLLMOutputSchema,
          messages,
          temperature: 0,
          maxOutputTokens: 10000,
          providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
        });
        return object;
      },
      {
        name: 'Flag Chat Analysis',
      }
    );

    const llmResult = await tracedFlagChatGeneration();

    // Convert LLM result to discriminated union format with camelCase
    const result: FlagChatStepResult =
      llmResult.type === 'flagChat'
        ? {
            type: 'flagChat',
            summaryMessage: llmResult.summary_message || '',
            summaryTitle: llmResult.summary_title || '',
          }
        : {
            type: 'noIssuesFound',
            message: llmResult.message || '',
          };

    return result;
  } catch (llmError) {
    console.warn('[FlagChatStep] LLM failed to generate valid response:', {
      error: llmError instanceof Error ? llmError.message : 'Unknown error',
      errorType: llmError instanceof Error ? llmError.name : 'Unknown',
    });

    // Return a default no issues found result
    return {
      type: 'noIssuesFound',
      message: 'Unable to analyze chat history for issues at this time.',
    };
  }
}

export async function runFlagChatStep(params: FlagChatStepParams): Promise<FlagChatStepResult> {
  try {
    const result = await generateFlagChatWithLLM(
      params.conversationHistory,
      params.userName,
      params.datasets,
      params.organizationDocs,
      params.analystInstructions
    );

    return result;
  } catch (error) {
    console.error('[flag-chat-step] Unexpected error:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // For other errors, throw a user-friendly message
    throw new Error('Unable to analyze the chat for review. Please try again later.');
  }
}
