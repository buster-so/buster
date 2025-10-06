import { Hono } from 'hono';
import GET from './GET';
import PUT from './PUT';

const app = new Hono().route('/', GET).route('/', PUT);

export default app;
