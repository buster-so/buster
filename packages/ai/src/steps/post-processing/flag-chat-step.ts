import { Agent, createStep } from '@mastra/core';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { flagChat } from '../../tools/post-processing/flag-chat';
import { noIssuesFound } from '../../tools/post-processing/no-issues-found';
import { MessageHistorySchema } from '../../utils/memory/types';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';
import { standardizeMessages } from '../../utils/standardizeMessages';

const inputSchema = z.object({
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('Name for the post-processing operation'),
  messageId: z.string().describe('Message ID for the current operation'),
  userId: z.string().describe('User ID for the current operation'),
  chatId: z.string().describe('Chat ID for the current operation'),
  isFollowUp: z.boolean().describe('Whether this is a follow-up message'),
  previousMessages: z.array(z.string()).describe('Array of previous messages for context'),
  datasets: z.string().describe('Assembled YAML content of all available datasets for context'),
});

export const flagChatOutputSchema = z.object({
  // Pass through all input fields
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('Name for the post-processing operation'),
  messageId: z.string().describe('Message ID for the current operation'),
  userId: z.string().describe('User ID for the current operation'),
  chatId: z.string().describe('Chat ID for the current operation'),
  isFollowUp: z.boolean().describe('Whether this is a follow-up message'),
  previousMessages: z.array(z.string()).describe('Array of previous messages for context'),
  datasets: z.string().describe('Assembled YAML content of all available datasets for context'),

  // New fields from this step
  toolCalled: z.string().describe('Name of the tool that was called by the agent'),
  summaryMessage: z.string().optional().describe('Brief summary of the issue detected'),
  summaryTitle: z.string().optional().describe('Short 3-6 word title for the summary'),
  message: z.string().optional().describe('Confirmation message indicating no issues found'),
});

// Template function that accepts datasets parameter
const createFlagChatInstructions = (datasets: string): string => {
  return `
<intro>
- You are a specialized AI agent within an AI-powered data analyst system.
- Your role is to review the chat history between the AI data analyst (Buster) and the user, identify signs that the user might be frustrated or that something went wrong in the chat, and flag the chat for review by the data team.
- Your tasks include:
  - Analyzing the chat history for specific signals of potential user frustration or issues.
  - Flagging chats that meet the criteria for review.
  - Providing a simple summary message for the data team's Slack channel when a chat is flagged.
</intro>

<event_stream>
You will be provided with a chronological event stream (may be truncated or partially omitted) containing the following types of events:
1. User messages: Current and past requests
2. Tool actions: Results from tool executions
3. sequentialThinking thoughts: Reasoning, thoughts, and decisions recorded by Buster
4. Other miscellaneous events generated during system operation
</event_stream>

<agent_loop>
You operate in a loop to complete tasks:
1. Immediately start by reviewing the chat history and looking for signals of potential user frustration or issues.
2. Continue reviewing until you have thoroughly assessed the chat.
3. If any signals are detected, use the \`flagChat\` tool to flag the chat and provide a summary message.
4. If no signals are detected, use the \`noIssuesFound\` tool to indicate that the chat does not need to be flagged.
</agent_loop>

<tool_use_rules>
- Follow tool schemas exactly, including all required parameters
- Do not mention tool names to users
- Use \`flagChat\` tool to flag the chat and provide a summary message when signals are detected
- Use \`noIssuesFound\` tool to indicate that no issues were detected
</tool_use_rules>

<signals_to_detect>
Look for the following signals that may indicate user frustration or issues in the chat:
1. No final answer or results were provided to the user.
2. The results returned were empty, zero, or null.
3. There were errors that prevented Buster from fulfilling the user's request.
4. The final response did not fully address the user's request or seemed like a stretch to fulfill it.
5. There was uncertainty or confusion in Buster's internal thoughts.
6. The final response showed that Buster failed to completely address the user's request.
7. There were signs of incomplete work or unresolved issues.
8. Major assumptions were made that could lead to significantly wrong results if incorrect.
</signals_to_detect>

<identification_guidelines>
- Review the user messages to understand their requests and expectations.
- Check if Buster provided a final answer or results. Look for messages or events indicating that results were generated and shared with the user.
- Examine the results to see if they are empty, zero, or null. This could indicate that the Buster wasn't able to thoroughly fulfill the user's request.
- Look for error messages or events that show Buster encountered problems while trying to fulfill the request.
- Assess whether the final response fully addresses the user's request. Look for signs that Buster had to make significant assumptions or approximations to provide an answer.
- Analyze Buster's internal thoughts for signs of uncertainty, confusion, or difficulty in interpreting the user's request or the data.
- Check if there are any unresolved issues or incomplete tasks in the chat history.
- Identify any major assumptions made by Buster that could significantly impact the results if incorrect. These might be things like:
  - Introducing a new concept, metric, segment, or filter not explicitly defined in the documentation (e.g., defining revenue from multiple unclear columns or using time zones as a proxy for location).
  - Choosing between multiple similar fields, tables, or calculation methods without clear guidance from the documentation (e.g., selecting one revenue field among several without justification).
  - Making decisions based on incomplete or ambiguous documentation, leading to high uncertainty (e.g., unclear whether to filter out certain records for a revenue calculation).
  - Assumptions where an incorrect choice could substantially alter the outcome of the analysis (e.g., a wrong column choice skewing revenue by millions).
</identification_guidelines>

<flagging_criteria>
Flag the chat if any of the following conditions are met:
- No final answer or results were provided.
- The results were empty, zero, or null.
  - If the results found in metrics are empty, zero, or null you *must* flag the chat (even if Buster explained why it was empty, zero, null in its final response).
- There were errors that prevented fulfilling the request.
- The final response did not fully address the request or seemed like a stretch.
- There was significant uncertainty or confusion in Buster's thoughts.
- The final response indicated failure to completely address the request.
- There were signs of incomplete work.
- Major assumptions were made that could lead to significantly wrong results.
</flagging_criteria>

<output_format>
- If the chat is flagged:
  - Use the \`flagChat\` tool.
  - Include a 3-6 word title that will serve as the header for the summary_message.
  - Include a simple summary message that briefly describes the issue detected.
    - The summary message should be concise and informative, suitable for sending to the data team's Slack channel.
    - The summary message should start with the user's name (e.g. Kevin reqeuested...)
    - When referring to the "AI analyst" or "AI data analyst", you should refer to it by it's name, "Buster" (e.g. "Buster made assumptions..." instead of "The AI analyst made assumptions...")
- If no issues are detected:
  - Use the \`noIssuesFound\` tool to indicate that the chat does not need to be flagged.
</output_format>

---

<dataset_context>
${datasets}
</dataset_context>
`;
};

const DEFAULT_OPTIONS = {
  maxSteps: 1,
  temperature: 0,
  maxTokens: 10000,
  providerOptions: {
    anthropic: {
      disableParallelToolCalls: true,
      thinking: { type: 'enabled', budgetTokens: 16000 },
    },
  },
};

export const flagChatStepExecution = async ({
  inputData,
}: {
  inputData: z.infer<typeof inputSchema>;
}): Promise<z.infer<typeof flagChatOutputSchema>> => {
  try {
    // Use the conversation history directly since this is post-processing
    const conversationHistory = inputData.conversationHistory;

    // Create instructions with datasets injected
    const instructionsWithDatasets = createFlagChatInstructions(
      inputData.datasets || 'No dataset context available.'
    );

    // Create agent with injected instructions
    const flagChatAgentWithContext = new Agent({
      name: 'Flag Chat Review',
      instructions: instructionsWithDatasets,
      model: anthropicCachedModel('claude-sonnet-4-20250514'),
      tools: {
        flagChat,
        noIssuesFound,
      },
      defaultGenerateOptions: DEFAULT_OPTIONS,
      defaultStreamOptions: DEFAULT_OPTIONS,
    });

    // Prepare messages for the agent - format conversation history as text for analysis
    let messages: CoreMessage[];
    if (conversationHistory && conversationHistory.length > 0) {
      // Format conversation history as text for analysis
      const chatHistoryText = JSON.stringify(conversationHistory, null, 2);
      const analysisPrompt = `Here is the chat history to analyze:

User: ${inputData.userName}

Chat History:
\`\`\`
${chatHistoryText}
\`\`\`

Please analyze this conversation history for potential user frustration or issues that should be flagged for review.`;

      messages = standardizeMessages(analysisPrompt);
    } else {
      // If no conversation history, create a message indicating that
      messages = standardizeMessages(`User: ${inputData.userName}

No conversation history available for analysis.`);
    }

    const tracedFlagChat = wrapTraced(
      async () => {
        const response = await flagChatAgentWithContext.generate(messages);
        return response;
      },
      {
        name: 'Flag Chat Review',
      }
    );

    const flagChatResult = await tracedFlagChat();

    // Extract tool call information
    const toolCalls = flagChatResult.toolCalls || [];
    if (toolCalls.length === 0) {
      throw new Error('No tool was called by the flag chat agent');
    }

    const toolCall = toolCalls[0]; // Should only be one with maxSteps: 1
    if (!toolCall) {
      throw new Error('Tool call is undefined');
    }

    if (!toolCall) {
      throw new Error('No tool was called by the flag chat agent');
    }

    return {
      // Pass through all input fields
      ...inputData,
      // Add new fields from this step
      toolCalled: toolCall.toolName,
      summaryMessage: toolCall.args.summary_message,
      summaryTitle: toolCall.args.summary_title,
      message: toolCall.args.message,
    };
  } catch (error) {
    console.error('Failed to analyze chat for flagging:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // For other errors, throw a user-friendly message
    throw new Error('Unable to analyze the chat for review. Please try again later.');
  }
};

export const flagChatStep = createStep({
  id: 'flag-chat',
  description:
    'This step analyzes the chat history to identify potential user frustration or issues and flags the chat for review if needed.',
  inputSchema,
  outputSchema: flagChatOutputSchema,
  execute: flagChatStepExecution,
});
