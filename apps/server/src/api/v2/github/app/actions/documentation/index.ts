import { Hono } from 'hono';
import GetById from './[id]/GET';
import DeleteById from './[id]/DELETE';
import POST from './POST';

const app = new Hono().route('/', POST).route('/:id', GetById).route('/:id', DeleteById);

export default app;
