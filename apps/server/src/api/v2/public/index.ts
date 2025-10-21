import { Hono } from 'hono';
import chats from './chats';
import github from './github';

const app = new Hono();

// Mount the chats route (includes nested messages endpoint)
app.route('/chats', chats);

// Mount the github route (includes actions endpoints)
app.route('/github', github);

// Add a root handler for the public API
app.get('/', (c) => {
  return c.json({
    message: 'Buster Public API v2',
    endpoints: {
      createChat: {
        method: 'POST',
        path: '/api/v2/public/chats',
        description: 'Create a chat session with SSE streaming',
        authentication: 'Bearer token (API key)',
      },
      updateMessage: {
        method: 'PUT',
        path: '/api/v2/public/chats/:id/messages/:messageId',
        description: 'Update a message (isCompleted, rawLlmMessages)',
        authentication: 'Bearer token (API key)',
      },
      createDocumentation: {
        method: 'POST',
        path: '/api/v2/public/github/actions/documentation',
        description: 'Create a documentation generation request',
        authentication: 'Bearer token (API key)',
      },
      getDocumentationStatus: {
        method: 'GET',
        path: '/api/v2/public/github/actions/documentation/:id',
        description: 'Get documentation generation status',
        authentication: 'Bearer token (API key)',
      },
      deleteDocumentation: {
        method: 'DELETE',
        path: '/api/v2/public/github/actions/documentation/:id',
        description: 'Cancel/complete documentation generation',
        authentication: 'Bearer token (API key)',
      },
    },
  });
});

export default app;
