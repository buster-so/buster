import { Hono } from 'hono';

const app = new Hono().get('/:id', async (c) => {
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
});

export default app;
