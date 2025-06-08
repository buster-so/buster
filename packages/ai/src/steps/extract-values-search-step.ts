import { Agent, createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { anthropicCachedModel } from '../utils/models/anthropic-cached';
import { appendToConversation, standardizeMessages } from '../utils/standardizeMessages';
import type {
  AnalystRuntimeContext,
  thinkAndPrepWorkflowInputSchema,
} from '../workflows/analyst-workflow';

const inputSchema = z.object({
  // This step receives initial workflow input through getInitData
});

export const extractValuesSearchOutputSchema = z.object({
  values: z.array(z.string()).describe('The values that the agent will search for.'),
});

const extractValuesInstructions = `
You are a Values Parser Agent. Your primary goal is to identify and extract concrete values/entities mentioned in the user request that are likely to appear as actual values in database columns.

**Core Task**: Extract specific, meaningful values from the user's request that could be used for database searches.

**What TO Extract (Focus on these types of values)**:
- **Product names**: "Red Bull", "iPhone 15", "Nike Air Max"
- **Company names**: "Acme Corp", "Google", "Microsoft"
- **People's names**: "John Smith", "Sarah Johnson"
- **Locations**: "California", "Europe", "New York", "San Francisco"
- **Categories/Segments**: "Premium tier", "Enterprise", "VIP"
- **Status values**: "completed", "pending", "active", "cancelled"
- **Features**: "waterproof", "wireless", "organic"
- **Industry terms**: "B2B", "SaaS", "e-commerce"
- **Brand names**: "Nike", "Adidas", "Apple"
- **Specific models/versions**: "Version 2.0", "Model X"

**What NOT TO Extract (Avoid these)**:
- **General concepts**: "revenue", "customers", "sales", "profit"
- **Time periods**: "last month", "Q1", "yesterday", "2024"
- **Generic attributes**: "name", "id", "description", "count"
- **Common words**: "the", "and", "with", "for"
- **Numbers without context**: "123", "45.6", "1000"
- **Generic IDs**: UUIDs like "9711ca55-...", database keys like "cust_12345"
- **Composite strings with non-semantic identifiers**: For "ticket 1a2b3c", only extract "ticket" if it's meaningful as a category

**Instructions**:
1. Carefully read the user's request
2. Identify any specific, distinctive values that have inherent business meaning
3. Extract only values that could realistically appear as data in database columns
4. Return an array of these extracted values
5. If no meaningful values are found, return an empty array

**Examples**:
- Input: "Show me sales for Red Bull in California"
  Output: ["Red Bull", "California"]
  
- Input: "What's the revenue trend for our Premium tier customers?"
  Output: ["Premium tier"]
  
- Input: "Compare Nike vs Adidas performance"
  Output: ["Nike", "Adidas"]
  
- Input: "Show me last month's revenue"
  Output: [] (no specific values, just time period and metric)

Focus only on extracting meaningful, specific values that could be searched for in a database.
`;

const valuesAgent = new Agent({
  name: 'Extract Values',
  instructions: extractValuesInstructions,
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
});

const extractValuesSearchStepExecution = async ({
  getInitData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  getInitData: () => Promise<z.infer<typeof thinkAndPrepWorkflowInputSchema>>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof extractValuesSearchOutputSchema>> => {
  try {
    const threadId = runtimeContext.get('threadId');
    const resourceId = runtimeContext.get('userId');

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

    const tracedValuesExtraction = wrapTraced(
      async () => {
        const response = await valuesAgent.generate(messages, {
          maxSteps: 0,
          output: extractValuesSearchOutputSchema,
          threadId: threadId,
          resourceId: resourceId,
        });

        return response.object;
      },
      {
        name: 'Extract Values',
      }
    );

    const values = await tracedValuesExtraction();

    return values;
  } catch (error) {
    console.error('Failed to extract values:', error);
    // Return empty values array instead of crashing
    return {
      values: [],
    };
  }
};

export const extractValuesSearchStep = createStep({
  id: 'extract-values-search',
  description: 'This step is a single llm call to quickly extract values from the user request.',
  inputSchema,
  outputSchema: extractValuesSearchOutputSchema,
  execute: extractValuesSearchStepExecution,
});
