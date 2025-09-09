import { getUserSuggestedPrompts } from '@buster/database';
import { GetSuggestedPromptsRequestSchema } from '@buster/server-shared/user';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().get(
  '/',
  zValidator('query', GetSuggestedPromptsRequestSchema),
  async (c) => {
    try {
      const userId = c.req.param('id');

      const authenticatedUser = c.get('busterUser');

      // Authorization check: Users can only access their own suggested prompts
      if (authenticatedUser.id !== userId) {
        throw new HTTPException(403, {
          message: 'Forbidden: You can only access your own suggested prompts',
        });
      }

      const suggestedPrompts = await getUserSuggestedPrompts({ userId });

      return c.json(suggestedPrompts);
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      console.error('[GetSuggestedPrompts] Error:', error);
      throw new HTTPException(500, {
        message: 'Error fetching suggested prompts',
      });
    }
  }
);

export default app;
