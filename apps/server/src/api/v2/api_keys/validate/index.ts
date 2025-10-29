import { Hono } from 'hono';
import POST from './POST';

const app = new Hono().route('/', POST);

export default app;
