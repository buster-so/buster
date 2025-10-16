import { Hono } from 'hono';
import POST from './POST';
import CALLBACK_GET from './callback/GET';

const app = new Hono().route('/', POST).route('/callback', CALLBACK_GET);

export default app;
