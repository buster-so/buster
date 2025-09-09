import type { ModelMessage } from '@buster/ai';
import { generateSuggestedMessages } from '@buster/ai';
import { updateUserSuggestedPrompts } from '@buster/database';
import {
  GenerateSuggestedPromptsRequestSchema,
  type SuggestedPromptsResponse,
} from '@buster/server-shared/user';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Placeholder function to get database context for a user
 * TODO: Implement this function to fetch user's database schemas and context
 */
async function getDatabaseContext(userId: string): Promise<string> {
  // Placeholder implementation
  console.info('[POST SuggestedPrompts] Getting database context for user:', userId);
  
  // TODO: Replace with actual implementation that:
  // 1. Gets user's organization
  // 2. Fetches permissioned datasets using @buster/access-controls
  // 3. Formats dataset schemas into documentation string
  // 4. Returns formatted database context
  
  return `
# Sample Database Context for User ${userId}

## Sales Data
- Table: sales_transactions
- Fields: transaction_id, customer_id, product_id, amount, date, region
- Description: Daily sales transaction records

## Customer Data  
- Table: customers
- Fields: customer_id, name, email, registration_date, tier
- Description: Customer profile and segment information

## Product Data
- Table: products  
- Fields: product_id, name, category, price, launch_date
- Description: Product catalog and pricing information
  `.trim();
}

/**
 * Placeholder function to get user's chat history
 * TODO: Implement this function to fetch recent user messages
 */
async function getUserChatHistory(userId: string): Promise<ModelMessage[]> {
  // Placeholder implementation
  console.info('[POST SuggestedPrompts] Getting chat history for user:', userId);
  
  // TODO: Replace with actual implementation that:
  // 1. Calls getUserChatHistory from @buster/database
  // 2. Converts message format to ModelMessage[]
  // 3. Limits to recent messages (last 10-20)
  // 4. Returns formatted chat history
  
  return [
    {
      role: 'user',
      content: 'Show me sales performance for last quarter',
    },
    {
      role: 'assistant', 
      content: 'Here is your quarterly sales analysis...',
    },
    {
      role: 'user',
      content: 'Can you create a dashboard for customer metrics?',
    },
  ];
}

const app = new Hono().post(
  '/',
  zValidator('json', GenerateSuggestedPromptsRequestSchema),
  async (c) => {
    try {
      // Get the user ID from the route parameter
      const userId = c.req.param('id');
      
      // Get the authenticated user (for authorization)
      const authenticatedUser = c.get('busterUser');
      
      // Authorization check: Users can only generate suggestions for themselves
      // (or add admin role check here if needed)
      if (authenticatedUser.id !== userId) {
        throw new HTTPException(403, { 
          message: 'Forbidden: You can only generate suggested prompts for yourself' 
        });
      }

      console.info('[POST SuggestedPrompts] Generating suggestions for user:', userId);

      // Step 1: Get database context (placeholder)
      const databaseContext = await getDatabaseContext(userId);

      // Step 2: Get user chat history (placeholder)
      const chatHistory = await getUserChatHistory(userId);

      // Step 3: Generate suggested prompts using AI task
      const generatedPrompts = await generateSuggestedMessages({
        chatHistory,
        databaseContext,
        userId,
      });

      // Step 4: Update the database with newly generated suggested prompts
      const updatedPrompts = await updateUserSuggestedPrompts({
        userId,
        suggestedPrompts: generatedPrompts,
      });

      const response: SuggestedPromptsResponse = {
        suggestedPrompts: updatedPrompts.suggestedPrompts,
        updatedAt: updatedPrompts.updatedAt,
      };

      console.info('[POST SuggestedPrompts] Successfully generated and saved suggestions for user:', userId);

      return c.json(response);
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('[POST SuggestedPrompts] Error generating suggestions:', error);
      throw new HTTPException(500, { 
        message: 'Error generating suggested prompts' 
      });
    }
  }
);

export default app;
