import { Hono } from 'hono';
import { createApiKeyAuthMiddleware } from '../../../../../middleware/api-key-auth';
import documentation from './documentation';

const app = new Hono().use(createApiKeyAuthMiddleware()).route('/documentation', documentation);

export default app;
