import { Hono } from 'hono';
import { createApiKeyAuthMiddleware } from '../../../../../middleware/api-key-auth';
import GET from './GET';
import POST from './POST';

const app = new Hono().use(createApiKeyAuthMiddleware()).route('/', GET).route('/', POST);

export default app;
