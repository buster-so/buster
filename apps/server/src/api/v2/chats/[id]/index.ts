import { Hono } from 'hono';
import GET from './GET';
import PUT from './PUT';
import SCREENSHOT from './screenshot';
import SHARING from './sharing';

const app = new Hono();

app.route('/', GET);
app.route('/', PUT);
app.route('/sharing', SHARING);
app.route('/screenshot', SCREENSHOT);

export default app;
