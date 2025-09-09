import { Hono } from 'hono';
import suggestedPromptsRoutes from './id/suggested-prompts';

const app = new Hono()
  .get('/:id', (c) => {
    const userId = c.req.param('id');

    // Stub data for individual user
    const stubUser = {
      id: userId,
      name: 'Example User',
      email: `user${userId}@example.com`,
      role: 'user',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    return c.json(stubUser);
  })
  // Mount suggested prompts routes
  .route('/:id/suggested-prompts', suggestedPromptsRoutes);

export default app;
