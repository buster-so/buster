import { Hono } from 'hono';
import DELETE from './DELETE';
import GET from './GET';
import POST from './POST';
import PUT from './PUT';

const app = new Hono().route('/', GET).route('/', POST).route('/', DELETE).route('/', PUT);

export default app;
