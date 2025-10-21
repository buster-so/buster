import { Hono } from 'hono';
import { createApiKeyAuthMiddleware } from '../../../../../../middleware/api-key-auth';
import DeleteById from './[id]/DELETE';
import GetById from './[id]/GET';
import POST from './POST';

const app = new Hono()
  .use(createApiKeyAuthMiddleware())
  .route('/', POST)
  .route('/:id', GetById)
  .route('/:id', DeleteById);

export default app;
