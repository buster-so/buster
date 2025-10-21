import { Hono } from 'hono';
import DeleteById from './[id]/DELETE';
import GetById from './[id]/GET';
import POST from './POST';
import { createApiKeyAuthMiddleware } from '../../../../../../middleware/api-key-auth';

const app = new Hono()
.use(createApiKeyAuthMiddleware())
.route('/', POST)
.route('/:id', GetById)
.route('/:id', DeleteById);

export default app;
