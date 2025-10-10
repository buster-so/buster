import { Hono } from 'hono';
import GET from './GET';

const app = new Hono().route('/', GET);

export default app;
