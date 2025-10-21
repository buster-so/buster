import { Hono } from 'hono';
import actions from './actions';

const app = new Hono().route('/actions', actions);

export default app;
