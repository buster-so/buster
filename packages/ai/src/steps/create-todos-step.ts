import { updateMessageFields } from '@buster/database';
import { Agent, createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { NoSuchToolError } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepWorkflowInputSchema } from '../schemas/workflow-schemas';
import { createTodoList } from '../tools/planning-thinking-tools/create-todo-item-tool';
import { ChunkProcessor } from '../utils/database/chunk-processor';
import { createTodoReasoningMessage } from '../utils/memory/todos-to-messages';
import type { BusterChatMessageReasoningSchema } from '../utils/memory/types';
import { ReasoningHistorySchema } from '../utils/memory/types';
import { anthropicCachedModel } from '../utils/models/anthropic-cached';
import {
  RetryWithHealingError,
  detectRetryableError,
  isRetryWithHealingError,
} from '../utils/retry';
import type { RetryableError, WorkflowContext } from '../utils/retry/types';
import { appendToConversation, standardizeMessages } from '../utils/standardizeMessages';
import { createOnChunkHandler, handleStreamingError } from '../utils/streaming';
import type { AnalystRuntimeContext } from '../workflows/analyst-workflow';

const inputSchema = thinkAndPrepWorkflowInputSchema;

export const createTodosOutputSchema = z.object({
  todos: z.string().describe('The todos that the agent will work on.'),
  reasoningHistory: ReasoningHistorySchema.optional().describe(
    'Reasoning history for todo creation'
  ),
  // Pass through dashboard context
  dashboardFiles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        versionNumber: z.number(),
        metricIds: z.array(z.string()),
      })
    )
    .optional(),
});

const todosInstructions = `
### Overview
You are a specialized AI agent within an AI-powered data analyst system. You are currently in "prep mode". Your task is to analyze a user request—using the chat history as additional context—and identify key aspects that need to be explored or defined, such as terms, metrics, timeframes, conditions, or calculations. 
Your role is to interpret a user request—using the chat history as additional context—and break down the request into a markdown TODO list. This TODO list should break down each aspect of the user request into specific TODO list items that the AI-powered data analyst system needs to think through and clarify before proceeding with its analysis (e.g., looking through data catalog documentation, writing SQL, building charts/dashboards, or fulfilling the user request).
**Important**: Pay close attention to the conversation history. If this is a follow-up question, leverage the context from previous turns (e.g., existing data context, previous plans or results) to identify what aspects of the most recent user request needs need to be interpreted.
---
### Tool Calling
You have access to various tools to complete tasks. Adhere to these rules:
1. **Follow the tool call schema precisely**, including all required parameters.
2. **Do not call tools that aren’t explicitly provided**, as tool availability varies dynamically based on your task and dependencies.
3. **Avoid mentioning tool names in user communication.** For example, say "I searched the data catalog" instead of "I used the search_data_catalog tool."
4. **Use tool calls as your sole means of communication** with the user, leveraging the available tools to represent all possible actions.
5. **Use the \`createTodoList\` tool** to create the TODO list.
---
### Identifying Conditions and Questions:
1. **Identify Conditions**:
    - Extract all conditions, including nouns, adjectives, and qualifiers (e.g., "mountain bike" → "mountain", "bike"; "best selling" → "best", "selling").
    - Decompose compound terms into their constituent parts unless they form a single, indivisible concept (e.g., "iced coffee" → "iced", "coffee").
    - Include ranking or aggregation terms (e.g., "most", "highest", "best") as separate conditions.
    - Do not assume related terms are interchangeable (e.g., "concert" and "tickets" are distinct).
    - Be extremely strict. Always try to break conditions into their smallest parts unless it is obviously referring to a single thing. (e.g. "movie franchises" should be "movie" and "franchise", but something like 'Star Wars' is referring to a single thing)
    - Occassionally, a word may look like a condition, but it is not. If the word is seemingly being used to give context, but it is not part of the identified question, it is not a condition. (e.g. "We think that there is a problem with the new coffee machines, has the number of repair tickets increased?", the question being asked is 'has the number of repair tickets increased for coffee machines?', so 'problem' is not a condition). This is rare, but it does happen.
2. **Identify Questions**:
   - Determine the main question(s), rephrasing for clarity and incorporating all relevant conditions.
   - For follow-ups, apply the same question structure with substituted conditions (e.g., "What about trucks?" inherits the prior question's structure).
3. **Edge Cases**:
   - List multiple questions if present.
   - Use context to resolve ambiguous terms, preserving single concepts when appropriate.

Examples:
1. Query: "What is the best selling sports car?"
   - Conditions: best, selling, sports, car
   - Question: What is the best selling car in the sports category?
   - Explanation: "Sports car" splits into "sports" and "car" as they are distinct attributes. "Best selling" splits into "best" and "selling" for ranking and action.

2. Query: "How many smart TVs were sold online?"
   - Conditions: smart, TV, sold, online
   - Question: How many smart TVs were sold through online channels?
   - Explanation: "Smart TV" splits into "smart" and "TV" as they are filterable attributes. "Sold" and "online" describe the action and channel.

3. Query: "We noticed delays in shipping, are truck deliveries late?"
   - Conditions: truck, delivery, late
   - Question: Are truck deliveries delayed?
   - Explanation: "Truck delivery" splits into "truck" and "delivery" as distinct attributes. "Late" is a condition. "Delays" is contextual, not a condition.
---
### Instructions
Before you do anything, use the Identifying Conditions and Questions instructions to identify the conditions and questions in the user request. You should understand what the user is really asking for, and what conditions are needed to answer the question.
Break the user request down into a TODO list items. Use a markdown format with checkboxes (\`[ ]\`).
Break down conditions into multiple todo items if they look like they may be referencing more than one thing. (e.g. if a todo item is asking to identify recliner chairs, you should break it down into two todo items: one to identify chairs, and one to identify recliners).
If there is a multiple part condition (e.g. "laptop series"), you should break it down into two todo items: one to identify laptops, and one to group laptops by series.
The TODO list should break down each aspect of the user request into tasks, based on the request. The list should be simple and straightforward, only representing relevant TODO items. It might include things like:
- Defining a term or metrics mentioned in the request.
- Defining time frames or date ranges that need to be specified.
- Determining specific values or enums required to identify product names, users, categories, etc.
- Determining which conditions or filters will need to be applied to the data.
- Determining if a condition requires multiple filters.
- Determining what specific entities or things are, how to query for them, etc.
- Determining the chart type and axes fields for visualizations
**Important Note on TODO List Items:**
- Each item should be a concise, direct statement of what needs to be decided, identified, or determined.
- Do not include specific options, examples, or additional explanations within the item, especially not in parentheses.
- For example:
  - Correct: \`Determine metric for "top customer"\`
  - Incorrect: \`Determine metric for "top customer" (e.g., most revenue generated, most orders place, etc).\`
- The TODO list is meant to guide the system's internal decision-making process, so it should focus on listing the decisions that need to be made, not on providing potential answers or clarifications.
- Assume that all relevant data is potentially available within the existing data sources  
**Note**: The TODO list must focus on enabling the system to make its own assumptions and decisions without seeking clarification from the user. Do not use phrases like "Clarify..." in the TODO list items to avoid implying that the system should ask the user for further input.
---
### Examples
#### User Request: "What is Baltic Born's return rate this month?"
\`\`\`
[ ] Determine how "Baltic Born" is identified
[ ] Determine how "return rate" is identified
[ ] Determine how to filter by "this month"
[ ] Determine the visualization type and axes
\`\`\`
#### User Request: "how many customers do we have"
\`\`\`
[ ] Determine how a "customer" is identified
[ ] Determine the visualization type and axes
\`\`\`
#### User Request: "there are around 400-450 teams using shop on-site. Can you get me the 30 biggest merchants?"
\`\`\`
[ ] Determine how to identify a "merchant" in the data
[ ] Determine metric for the "biggest merchants"
[ ] Determine criteria to filter merchants to those using shop on-site
[ ] Determine sorting and limit for selecting the top 30 merchants
[ ] Determine the visualization type and axes
\`\`\`
### User Request: "What data do you have access to currently in regards to hubspot?"
\`\`\`
[ ] Determine if HubSpot data is included with the available data
\`\`\`
### User Request: "show me important stuff" 
\`\`\`
[ ] Determine what “important stuff” refers to in terms of metrics or entities
[ ] Determine which metrics to return
[ ] Determine the visualization type and axes for each metric
\`\`\`
### User Request: "get me our monthly sales and also 5 other charts that show me monthly sales with various groupings" 
\`\`\`
[ ] Determine how "monthly sales" is identified
[ ] Determine the time frame for monthly sales dashboard
[ ] Determine specific dimensions for each of the five grouping charts
[ ] Determine the visualization type and axes for each of the six charts
\`\`\`
### User Request: "what will sales be in Q4. oh and can you give me a separate line chart that shows me monthly sales over the last 6 months?" 
\`\`\`
[ ] Address inability to do forecasts
[ ] Determine how "sales" is identified
[ ] Determine how to group sales by month
[ ] Determine the visualization type and axes for each chart
\`\`\`
### User Request: "What's the influence of unicorn sightings on our sales?"
\`\`\`
[ ] Determine how "unicorn sightings" is identified
[ ] Determine how to identify "sales"
[ ] Determine how to identify the influence of unicorn sightings on sales
[ ] Determine the visualization type and axes for the chart
\`\`\`
### User Request: "I have a Fedex Smartpost tracking number and I need the USPS tracking number.  Can you find that for me? Here is the fedex number: 286744112345"
\`\`\`
[ ] Determine if FedEx Smartpost tracking data is available in the current data sources
[ ] Determine if USPS tracking number mappings exist in the available data
[ ] Determine how to identify the relationship between FedEx and USPS tracking numbers for Smartpost shipments
\`\`\`
---
### System Limitations
- The system is not capable of writing python, building forecasts, or doing "what-if" hypothetical analysis
    - If the user requests something that is not supported by the system (see System Limitations section), include this as an item in the TODO list.
    - Example: \`Address inability to do forecasts\`
---
### Best Practices
- Consider ambiguities in the request.
- Focus on steps that the system can take to interpret the request and make necessary decisions.
- Be specific about what needs to be decided, identified, or determined.
- Keep the word choice, sentence length, etc., simple, concise, and direct.
- Use markdown formatting with checkboxes to make the TODO list clear and actionable.
- Do not generate TODO list items about currency normalization. Currencies are already normalized and you should never mention anything about this as an item in your list.
---
### Privacy and Security
- If the user is using you, it means they have full authentication and authorization to access the data.
- Do not mention privacy or security issues in the TODO list, if it is a concern then the data will not be accessible anyway.
`;

const DEFAULT_OPTIONS = {
  maxSteps: 1,
  temperature: 0,
  maxTokens: 300,
};

export const todosAgent = new Agent({
  name: 'Create Todos',
  instructions: todosInstructions,
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
  tools: {
    createTodoList,
  },
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});

const todoStepExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof createTodosOutputSchema>> => {
  const messageId = runtimeContext.get('messageId') as string | null;
  const abortController = new AbortController();
  let retryCount = 0;
  const maxRetries = 3;

  // Initialize chunk processor for streaming with available tools
  const availableTools = new Set(['createTodoList']);
  const chunkProcessor = new ChunkProcessor(messageId, [], [], [], undefined, availableTools);

  try {
    // Use the input data directly
    const prompt = inputData.prompt;
    const conversationHistory = inputData.conversationHistory;

    // Prepare messages for the agent
    let messages: CoreMessage[];
    if (conversationHistory && conversationHistory.length > 0) {
      // Use conversation history as context + append new user message
      messages = appendToConversation(conversationHistory as CoreMessage[], prompt);
    } else {
      // Otherwise, use just the prompt
      messages = standardizeMessages(prompt);
    }

    // Set initial messages in chunk processor
    chunkProcessor.setInitialMessages(messages);

    // Main execution loop with retry logic
    while (retryCount <= maxRetries) {
      try {
        const wrappedStream = wrapTraced(
          async () => {
            // Create stream directly without retryableAgentStreamWithHealing
            const stream = await todosAgent.stream(messages, {
              toolCallStreaming: true,
              runtimeContext,
              maxRetries: 5,
              abortSignal: abortController.signal,
              toolChoice: {
                type: 'tool',
                toolName: 'createTodoList',
              },
              onChunk: createOnChunkHandler({
                chunkProcessor,
                abortController,
                finishingToolNames: [], // No finishing tools for todos
              }),
              onError: async (event: { error: unknown }) => {
                const error = event.error;
                console.error('Create Todos stream error caught in onError:', error);

                // Check if this is a retryable error with custom healing message
                const isRetryable =
                  NoSuchToolError.isInstance(error) ||
                  (error instanceof Error && error.name === 'AI_InvalidToolArgumentsError');

                if (!isRetryable || retryCount >= maxRetries) {
                  console.error('Create Todos onError: Not retryable or max retries reached', {
                    isRetryable,
                    retryCount,
                    maxRetries,
                  });
                  // Not retryable or max retries reached - let it fail
                  return; // Let the error propagate normally
                }

                // Create custom healing message for todos step
                const toolName = 'toolName' in error ? String(error.toolName) : 'unknown';
                const healingMessage = {
                  role: 'tool' as const,
                  content: [
                    {
                      type: 'tool-result' as const,
                      toolCallId: 'toolCallId' in error ? String(error.toolCallId) : 'unknown',
                      toolName: 'toolName' in error ? String(error.toolName) : 'unknown',
                      result: {
                        error:
                          'Invalid tool call. Your job at this moment is to strictly call the createTodoList tool. This is the only tool available for creating the TODO list.',
                      },
                    },
                  ],
                };

                console.info('Create Todos onError: Setting up retry', {
                  retryCount: retryCount + 1,
                  maxRetries,
                  toolName,
                });

                // Throw a special error with the healing info to trigger retry
                throw new RetryWithHealingError({
                  type: NoSuchToolError.isInstance(error)
                    ? 'no-such-tool'
                    : 'invalid-tool-arguments',
                  originalError: error,
                  healingMessage,
                });
              },
            });

            return stream;
          },
          {
            name: 'Create Todos',
            spanAttributes: {
              messageCount: messages.length,
              retryAttempt: retryCount,
            },
          }
        );

        const stream = await wrappedStream();

        // Process the stream - chunks are handled by onChunk callback
        for await (const _chunk of stream.fullStream) {
          // Stream is being processed via onChunk callback
          // Todo items are being collected in real-time
          if (abortController.signal.aborted) {
            break;
          }
        }

        console.info('Create Todos: Stream completed successfully');
        break; // Exit the retry loop on success
      } catch (error) {
        console.error('Create Todos: Error in stream processing', error);

        // Handle our special retry error
        if (isRetryWithHealingError(error)) {
          const retryableError = error.retryableError;

          // Get the current messages from chunk processor to find the failed tool call
          const currentMessages = chunkProcessor.getAccumulatedMessages();
          const healingMessage = retryableError.healingMessage;
          let insertionIndex = currentMessages.length; // Default to end

          // If this is a NoSuchToolError, find the correct position to insert the healing message
          if (retryableError.type === 'no-such-tool' && Array.isArray(healingMessage.content)) {
            const firstContent = healingMessage.content[0];
            if (
              firstContent &&
              typeof firstContent === 'object' &&
              'type' in firstContent &&
              firstContent.type === 'tool-result' &&
              'toolCallId' in firstContent &&
              'toolName' in firstContent
            ) {
              // Find the assistant message with the failed tool call
              for (let i = currentMessages.length - 1; i >= 0; i--) {
                const msg = currentMessages[i];
                if (msg && msg.role === 'assistant' && Array.isArray(msg.content)) {
                  // Find tool calls in this message
                  const toolCalls = msg.content.filter(
                    (
                      c
                    ): c is {
                      type: 'tool-call';
                      toolCallId: string;
                      toolName: string;
                      args: unknown;
                    } =>
                      typeof c === 'object' &&
                      c !== null &&
                      'type' in c &&
                      c.type === 'tool-call' &&
                      'toolCallId' in c &&
                      'toolName' in c &&
                      'args' in c
                  );

                  // Check each tool call to see if it matches and has no result
                  for (const toolCall of toolCalls) {
                    // Check if this tool call matches the failed tool name
                    if (toolCall.toolName === firstContent.toolName) {
                      // Look ahead for tool results
                      let hasResult = false;
                      for (let j = i + 1; j < currentMessages.length; j++) {
                        const nextMsg = currentMessages[j];
                        if (nextMsg && nextMsg.role === 'tool' && Array.isArray(nextMsg.content)) {
                          const hasMatchingResult = nextMsg.content.some(
                            (c) =>
                              typeof c === 'object' &&
                              c !== null &&
                              'type' in c &&
                              c.type === 'tool-result' &&
                              'toolCallId' in c &&
                              c.toolCallId === toolCall.toolCallId
                          );
                          if (hasMatchingResult) {
                            hasResult = true;
                            break;
                          }
                        }
                      }

                      // If this tool call has no result, this is our failed call
                      if (!hasResult) {
                        console.info(
                          'Create Todos: Found orphaned tool call, using its ID for healing',
                          {
                            toolCallId: toolCall.toolCallId,
                            toolName: toolCall.toolName,
                            atIndex: i,
                          }
                        );

                        // Update the healing message with the correct toolCallId
                        firstContent.toolCallId = toolCall.toolCallId;

                        // Insert position is right after this assistant message
                        insertionIndex = i + 1;
                        break;
                      }
                    }
                  }

                  // If we found the position, stop searching
                  if (insertionIndex !== currentMessages.length) break;
                }
              }
            }
          }

          console.info('Create Todos: Retrying with healing message', {
            retryCount,
            errorType: retryableError.type,
            insertionIndex,
            totalMessages: currentMessages.length,
          });

          // Create new messages array with healing message inserted at the correct position
          const updatedMessages = [
            ...currentMessages.slice(0, insertionIndex),
            healingMessage,
            ...currentMessages.slice(insertionIndex),
          ];

          // Update messages for the retry
          messages = updatedMessages;

          // Reset chunk processor with the properly ordered messages
          chunkProcessor.setInitialMessages(messages);

          // Force save to persist the healing message immediately
          await chunkProcessor.saveToDatabase();

          retryCount++;

          // Continue to next retry iteration
          continue;
        }

        // Handle normal AbortError (from finishing tools)
        if (error instanceof Error && error.name === 'AbortError') {
          console.info('Create Todos: Stream aborted successfully (normal completion)');
          break; // Normal abort, exit retry loop
        }

        // Any other error at this point is fatal
        console.error('Create Todos: Fatal error - not retryable', {
          errorName: error instanceof Error ? error.name : 'unknown',
          errorMessage: error instanceof Error ? error.message : String(error),
        });

        // Re-throw the error
        throw error;
      }
    }

    // Get the reasoning history - it already contains the streaming todo file entry
    const reasoningHistory = chunkProcessor.getReasoningHistory();
    let todosString = '';

    // Extract todos from the file entry in reasoning history
    // Look for any file entry with a todo-related file name
    for (const entry of reasoningHistory) {
      if (entry.type === 'files' && entry.files) {
        // Check each file in the entry
        for (const [fileId, file] of Object.entries(entry.files)) {
          // Check if this is a todo file by looking at the file name or ID
          if (file?.file_name === 'todos' || fileId.startsWith('todo-')) {
            if (file?.file?.text) {
              todosString = file.file.text;
              break;
            }
          }
        }
        if (todosString) break;
      }
    }

    // Final save is handled by ChunkProcessor automatically
    // The todo file entry is already in the reasoning history from streaming

    return {
      todos: todosString,
      reasoningHistory: reasoningHistory as z.infer<typeof ReasoningHistorySchema>,
      dashboardFiles: inputData.dashboardFiles, // Pass through dashboard context
    };
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      // Get the reasoning history - it already contains the streaming todo file entry
      const reasoningHistory = chunkProcessor.getReasoningHistory();
      let todosString = '';

      // Extract todos from the file entry in reasoning history
      // Look for any file entry with a todo-related file name
      for (const entry of reasoningHistory) {
        if (entry.type === 'files' && entry.files) {
          // Check each file in the entry
          for (const [fileId, file] of Object.entries(entry.files)) {
            // Check if this is a todo file by looking at the file name or ID
            if (file?.file_name === 'todos' || fileId.startsWith('todo-')) {
              if (file?.file?.text) {
                todosString = file.file.text;
                break;
              }
            }
          }
          if (todosString) break;
        }
      }

      // The todo file entry is already in the reasoning history from streaming

      return {
        todos: todosString,
        reasoningHistory: reasoningHistory as z.infer<typeof ReasoningHistorySchema>,
        dashboardFiles: inputData.dashboardFiles, // Pass through dashboard context
      };
    }

    console.error('Failed to create todos:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // For other errors, throw a user-friendly message
    throw new Error(
      'Unable to create the analysis plan. Please try again or rephrase your request.'
    );
  }
};

export const createTodosStep = createStep({
  id: 'create-todos',
  description: 'This step is a single llm call to quickly create todos for the agent to work on.',
  inputSchema,
  outputSchema: createTodosOutputSchema,
  execute: todoStepExecution,
});
