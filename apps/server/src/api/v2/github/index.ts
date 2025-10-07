import { Hono } from 'hono';
import APP from './app';

const app = new Hono().route('/app', APP);

export default app;
