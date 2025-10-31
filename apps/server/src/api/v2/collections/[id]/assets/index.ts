import { Hono } from 'hono';
import { requireAuth } from '../../../../../middleware/auth';
import { standardErrorHandler } from '../../../../../utils/response';
import DELETE from './DELETE';
import POST from './POST';

const app = new Hono().route('/', POST).route('/', DELETE);

export default app;
