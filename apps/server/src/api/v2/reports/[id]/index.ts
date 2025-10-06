import { Hono } from 'hono';
import GET from './GET';
import PUT from './PUT';
import SCREENSHOT from './screenshot';
import SHARING from './sharing';

const app = new Hono()
  .route('/', GET)
  .route('/', PUT)
  .route('/sharing', SHARING)
  .route('/screenshot', SCREENSHOT);

export default app;
