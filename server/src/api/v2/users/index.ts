import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../../../middleware/auth';

const app = new Hono()
  // Apply authentication globally to ALL routes in this router
  .use('*', requireAuth)
  .get('/', (c) => {
    // Stub data for user listing (only accessible to authenticated users)
    const stubUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'user' },
    ];

    return c.json(stubUsers);
  })
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
  .post(
    '/',
    zValidator(
      'form',
      z.object({
        name: z.string().min(1),
      })
    ),
    (c) => {
      return c.json({ message: 'User created' });
    }
  );

export default app;
