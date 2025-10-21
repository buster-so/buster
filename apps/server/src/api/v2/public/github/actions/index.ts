import { Hono } from 'hono';
import documentation from './documentation';

const app = new Hono().route('/documentation', documentation);

export default app;
