import { Hono } from 'hono';
import GET from './GET';
import PATCH from './PATCH';
import POST from './POST';

const app = new Hono();

app.route('/', GET);
app.route('/', POST);
app.route('/', PATCH);

export default app;
