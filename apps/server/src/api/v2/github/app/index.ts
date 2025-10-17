import { Hono } from 'hono';
import GET from './GET';
import ACTIONS from './actions';
import INSTALL from './install';
import WEBHOOKS from './webhooks';

const app = new Hono()
  .route('/', GET)
  .route('/webhooks', WEBHOOKS)
  .route('/install', INSTALL)
  .route('/actions', ACTIONS);

export default app;
