import { ChatError } from '@buster/server-shared/chats';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../../middleware/auth';
import { POST } from './POST';

const app = new Hono()
  // Apply authentication middleware
  .use('*', requireAuth)
  .route('/', POST)
  .onError((e, c) => {
    if (e instanceof ChatError) {
      return c.json(e.toResponse(), e.statusCode);
    }
    if (e instanceof HTTPException) {
      return e.getResponse();
    }

    throw new HTTPException(500, {
      message: 'Internal server error',
    });
  });

export default app;
