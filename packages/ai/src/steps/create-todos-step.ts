import { Agent, createStep } from '@mastra/core';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { anthropicCachedModel } from '../utils/models/anthropic-cached';
import { appendToConversation, standardizeMessages } from '../utils/standardizeMessages';
import type { thinkAndPrepWorkflowInputSchema } from '../workflows/analyst-workflow';

const inputSchema = z.object({
  // This step receives initial workflow input through getInitData
});

export const createTodosOutputSchema = z.object({
  todos: z.string().describe('The todos that the agent will work on.'),
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
5. **Use the \`create_todo_list\` tool** to create the TODO list.
---
### Instructions
Break the user request down into a TODO list items. Use a markdown format with checkboxes (\`[ ]\`).
The TODO list should break down each aspect of the user request into tasks, based on the request. The list should be simple and straightforward, only representing relevant TODO items. It might include things like:
- Defining a term or metrics mentioned in the request.
- Defining time frames or date ranges that need to be specified.
- Determining specific values or enums required to identify product names, users, categories, etc.
- Determining which conditions or filters will need to be applied to the data.
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
### User Request: "I have a Fedex Smartpost tracking number and I need the USPS tracking nmber.  Can you find that for me? Here is the fedex number: 286744112345
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
`;

const DEFAULT_OPTIONS = {
  maxSteps: 0,
};

export const todosAgent = new Agent({
  name: 'Create Todos',
  instructions: todosInstructions,
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});

const todoStepExecution = async ({
  getInitData,
}: {
  inputData: z.infer<typeof inputSchema>;
  getInitData: () => Promise<z.infer<typeof thinkAndPrepWorkflowInputSchema>>;
}): Promise<z.infer<typeof createTodosOutputSchema>> => {
  try {
    // Get the workflow input data
    const initData = await getInitData();
    const prompt = initData.prompt;
    const conversationHistory = initData.conversationHistory;

    // Prepare messages for the agent
    let messages: CoreMessage[];
    if (conversationHistory && conversationHistory.length > 0) {
      // Use conversation history as context + append new user message
      messages = appendToConversation(conversationHistory as CoreMessage[], prompt);
    } else {
      // Otherwise, use just the prompt
      messages = standardizeMessages(prompt);
    }

    const tracedTodos = wrapTraced(
      async () => {
        const response = await todosAgent.generate(messages, {
          output: createTodosOutputSchema,
        });

        return response.object;
      },
      {
        name: 'Create Todos',
      }
    );

    const todos = await tracedTodos();

    return todos;
  } catch (error) {
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
