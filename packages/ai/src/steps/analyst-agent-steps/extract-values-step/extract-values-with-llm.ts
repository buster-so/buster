import type { ModelMessage } from 'ai';
import { generateObject } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { Haiku35 } from '../../../llm/haiku-3-5';

// Schema for what the LLM returns
const llmOutputSchema = z.object({
  values: z.array(z.string()).describe('The values that the agent will search for'),
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

/**
 * Extracts values from the user prompt using LLM
 */
export async function extractValuesWithLLM(
  prompt: string,
  conversationHistory?: ModelMessage[]
): Promise<string[]> {
  try {
    // Prepare messages for the LLM
    const messages: ModelMessage[] = [
      {
        role: 'system',
        content: extractValuesInstructions,
      },
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    const userMessage: ModelMessage = {
      role: 'user',
      content: prompt,
    };

    // Add the current user prompt
    messages.push(userMessage);

    const tracedValuesExtraction = wrapTraced(
      async () => {
        const { object } = await generateObject({
          model: await Haiku35,
          schema: llmOutputSchema,
          messages,
          temperature: 0,
        });

        return object;
      },
      {
        name: 'Extract Values',
      }
    );

    const result = await tracedValuesExtraction();
    return result.values ?? [];
  } catch (llmError) {
    // Handle LLM generation errors specifically
    console.warn('[ExtractValues] LLM failed to generate valid response:', {
      error: llmError instanceof Error ? llmError.message : 'Unknown error',
      errorType: llmError instanceof Error ? llmError.name : 'Unknown',
    });

    // Continue with empty values instead of failing
    return [];
  }
}
