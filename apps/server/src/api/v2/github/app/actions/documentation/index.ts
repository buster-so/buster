import { Hono } from 'hono';
import POST from './POST';
import GetById from './[id]/GET';

const app = new Hono().route('/', POST).route('/:id', GetById);

export default app;
