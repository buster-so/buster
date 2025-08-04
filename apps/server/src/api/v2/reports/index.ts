import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import GET from './GET';
import individualReport from './[id]';

const app = new Hono().use('*', requireAuth).route('/', GET).route('/:id', individualReport);

export default app;
