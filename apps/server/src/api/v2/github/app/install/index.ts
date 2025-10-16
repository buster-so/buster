import { Hono } from 'hono';
import DELETE from './DELETE';
import POST from './POST';
import CALLBACK_GET from './callback/GET';

const app = new Hono().route('/', POST).route('/', DELETE).route('/callback', CALLBACK_GET);

export default app;
