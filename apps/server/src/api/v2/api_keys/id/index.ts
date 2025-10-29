import { Hono } from 'hono';
import DELETE from './DELETE';
import GET from './GET';

const app = new Hono().route('/', GET).route('/', DELETE);

export default app;
