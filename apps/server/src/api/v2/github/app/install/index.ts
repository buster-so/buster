import { Hono } from 'hono';
import CALLBACK_GET from './callback/GET';
import DELETE from './DELETE';
import POST from './POST';

const app = new Hono().route('/', POST).route('/', DELETE).route('/callback', CALLBACK_GET);

export default app;
