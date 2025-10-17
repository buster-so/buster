import { Hono } from 'hono';
import ACTIONS from './actions';
import GET from './GET';
import INSTALL from './install';
import WEBHOOKS from './webhooks';

const app = new Hono()
  .route('/', GET)
  .route('/webhooks', WEBHOOKS)
  .route('/install', INSTALL)
  .route('/actions', ACTIONS);

export default app;
