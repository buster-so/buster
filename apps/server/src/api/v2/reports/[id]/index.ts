import { Hono } from 'hono';
import GET from './GET';
import PUT from './PUT';
import SHARING from './sharing';

const app = new Hono().route('/', GET).route('/', PUT).route('/sharing', SHARING);

export default app;
