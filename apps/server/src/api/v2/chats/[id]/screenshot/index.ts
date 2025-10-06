import { Hono } from 'hono';
import GET from './GET';
import PUT from './PUT';
import STATIC from './static.GET';

const app = new Hono().route('/', GET).route('/', PUT).route('/static', STATIC);

export default app;
