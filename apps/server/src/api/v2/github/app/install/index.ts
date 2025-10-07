import { Hono } from 'hono';
import GET from './GET';
import CALLBACK_GET from './callback/GET';

const app = new Hono().route('/', GET).route('/callback', CALLBACK_GET);

export default app;
