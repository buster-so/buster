import {
  createShortcutRequestSchema,
  updateShortcutRequestSchema,
} from '@buster/server-shared/shortcuts';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../../../middleware/auth';
import '../../../types/hono.types';
import { HTTPException } from 'hono/http-exception';
import { deleteShortcutHandler } from './[id]/DELETE';
import { getShortcutHandler } from './[id]/GET';
import { updateShortcutHandler } from './[id]/PUT';
import { listShortcutsHandler } from './GET';
import { createShortcutHandler } from './POST';

// Schema for path params
const shortcutIdParamSchema = z.object({
  id: z.string().uuid(),
});

const app = new Hono()
  // Apply authentication middleware
  .use('*', requireAuth)

  // List all accessible shortcuts (personal + workspace)
  .get('/', async (c) => {
    const user = c.get('busterUser');
    const response = await listShortcutsHandler(user);
    return c.json(response);
  })

  // Get a single shortcut by ID
  .get('/:id', zValidator('param', shortcutIdParamSchema), async (c) => {
    const user = c.get('busterUser');
    const { id } = c.req.valid('param');
    const response = await getShortcutHandler(user, id);
    return c.json(response);
  })

  // Create a new shortcut
  .post('/', zValidator('json', createShortcutRequestSchema), async (c) => {
    const user = c.get('busterUser');
    const data = c.req.valid('json');
    const response = await createShortcutHandler(user, data);
    return c.json(response, 201);
  })

  // Update an existing shortcut
  .put(
    '/:id',
    zValidator('param', shortcutIdParamSchema),
    zValidator('json', updateShortcutRequestSchema),
    async (c) => {
      const user = c.get('busterUser');
      const { id } = c.req.valid('param');
      const data = c.req.valid('json');
      const response = await updateShortcutHandler(user, id, data);
      return c.json(response);
    }
  )

  // Delete a shortcut
  .delete('/:id', zValidator('param', shortcutIdParamSchema), async (c) => {
    const user = c.get('busterUser');
    const { id } = c.req.valid('param');
    const response = await deleteShortcutHandler(user, id);
    return c.json(response);
  })

  // Error handling
  .onError((e, _c) => {
    if (e instanceof HTTPException) {
      return e.getResponse();
    }

    console.error('Unhandled error in shortcuts API:', e);
    throw new HTTPException(500, {
      message: 'Internal server error',
    });
  });

export default app;
