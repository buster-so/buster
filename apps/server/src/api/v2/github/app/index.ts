import { Hono } from 'hono';
import GET from './GET';
import INSTALL from './install';
import WEBHOOKS from './webhooks';

const app = new Hono().route('/', GET).route('/webhooks', WEBHOOKS).route('/install', INSTALL);

export default app;
