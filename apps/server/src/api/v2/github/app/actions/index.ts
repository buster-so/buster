import { Hono } from 'hono';
import POST from './POST';
import GET from './GET';
import { createApiKeyAuthMiddleware } from '../../../../../middleware/api-key-auth';

const app = new Hono()
.use(createApiKeyAuthMiddleware())
.route('/', GET)
.route('/', POST);

export default app;
