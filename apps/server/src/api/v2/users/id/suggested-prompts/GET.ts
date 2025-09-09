import { getUserSuggestedPrompts } from '@buster/database';
import {
  GetSuggestedPromptsRequestSchema,
  type SuggestedPromptsResponse,
} from '@buster/server-shared/user';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().get(
  '/',
  zValidator('query', GetSuggestedPromptsRequestSchema),
  async (c) => {
    try {
      // Get the user ID from the route parameter
      const userId = c.req.param('id');
      
      // Get the authenticated user (for authorization)
      const authenticatedUser = c.get('busterUser');
      
      // Authorization check: Users can only access their own suggested prompts
      // (or add admin role check here if needed)
      if (authenticatedUser.id !== userId) {
        throw new HTTPException(403, { 
          message: 'Forbidden: You can only access your own suggested prompts' 
        });
      }

      // Get suggested prompts from database
      const suggestedPrompts = await getUserSuggestedPrompts({ userId });

      if (!suggestedPrompts) {
        // Return empty suggestions if user has none
        const response: SuggestedPromptsResponse = {
          suggestedPrompts: {
            report: [],
            dashboard: [],
            visualization: [],
            help: [],
          },
          updatedAt: new Date().toISOString(),
        };
        return c.json(response);
      }

      const response: SuggestedPromptsResponse = {
        suggestedPrompts: suggestedPrompts.suggestedPrompts,
        updatedAt: suggestedPrompts.updatedAt,
      };

      return c.json(response);
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('[GetSuggestedPrompts] Error:', error);
      throw new HTTPException(500, { 
        message: 'Error fetching suggested prompts' 
      });
    }
  }
);

export default app;
