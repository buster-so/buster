import { Hono } from 'hono';
import GetById from './[id]/GET';
import POST from './POST';

const app = new Hono().route('/', POST).route('/:id', GetById);

export default app;
