import { Hono } from 'hono';
import DeleteById from './[id]/DELETE';
import GetById from './[id]/GET';
import POST from './POST';

const app = new Hono().route('/', POST).route('/:id', GetById).route('/:id', DeleteById);

export default app;
