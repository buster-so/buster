import {
  CreateDocRequestSchema,
  GetDocByIdParamsSchema,
  GetDocsListRequestSchema,
  UpdateDocRequestSchema,
} from '@buster/server-shared/docs';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import { standardErrorHandler } from '../../../utils/response';
import { listDocsHandler } from './GET';
import { deleteDocHandler } from './id/DELETE';
import { getDocHandler } from './id/GET';
import { updateDocHandler } from './id/PUT';
import { createDocHandler } from './POST';

const app = new Hono()
  .use('*', requireAuth)

  // GET /docs - List all docs
  .get('/', zValidator('query', GetDocsListRequestSchema), async (c) => {
    const request = c.req.valid('query');
    const user = c.get('busterUser');

    const response = await listDocsHandler(request, user);
    return c.json(response);
  })

  // POST /docs - Create new doc (upsert)
  .post('/', zValidator('json', CreateDocRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');

    const response = await createDocHandler(request, user);
    return c.json(response);
  })

  // GET /docs/:id - Get single doc
  .get('/:id', zValidator('param', GetDocByIdParamsSchema), async (c) => {
    const params = c.req.valid('param');
    const user = c.get('busterUser');

    const response = await getDocHandler(params.id, user);
    return c.json(response);
  })

  // PUT /docs/:id - Update doc
  .put(
    '/:id',
    zValidator('param', GetDocByIdParamsSchema),
    zValidator('json', UpdateDocRequestSchema),
    async (c) => {
      const params = c.req.valid('param');
      const request = c.req.valid('json');
      const user = c.get('busterUser');

      const response = await updateDocHandler(params.id, request, user);
      return c.json(response);
    }
  )

  // PATCH /docs/:id - Update doc (same as PUT)
  .patch(
    '/:id',
    zValidator('param', GetDocByIdParamsSchema),
    zValidator('json', UpdateDocRequestSchema),
    async (c) => {
      const params = c.req.valid('param');
      const request = c.req.valid('json');
      const user = c.get('busterUser');

      const response = await updateDocHandler(params.id, request, user);
      return c.json(response);
    }
  )

  // DELETE /docs/:id - Soft delete doc
  .delete('/:id', zValidator('param', GetDocByIdParamsSchema), async (c) => {
    const params = c.req.valid('param');
    const user = c.get('busterUser');

    const response = await deleteDocHandler(params.id, user);
    return c.json(response);
  })

  .onError(standardErrorHandler);

export default app;
