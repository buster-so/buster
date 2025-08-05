import { Hono } from 'hono';
import PUT from './PUT';

const app = new Hono().route('/', PUT);

export default app;
