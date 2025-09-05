import { Hono } from 'hono';
import chats from './chats';

const app = new Hono();

// Mount the chats route
app.route('/chats', chats);

// Add a root handler for the public API
app.get('/', (c) => {
  return c.json({
    message: 'Buster Public API v2',
    endpoints: {
      chats: {
        method: 'POST',
        path: '/api/v2/public/chats',
        description: 'Create a chat session with SSE streaming',
        authentication: 'Bearer token (API key)',
      },
    },
  });
});

export default app;
