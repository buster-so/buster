import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import { standardErrorHandler } from '../../../utils/response';
import GET from './GET';

const app = new Hono().use('*', requireAuth).route('/', GET).onError(standardErrorHandler);

export default app;
