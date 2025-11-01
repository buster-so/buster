import { Hono } from 'hono';
import GET from './GET';
import PATCH from './PATCH';
import SUGGESTED_PROMPTS from './suggested-prompts/index';

const app = new Hono()
  .route('/', GET)
  .route('/', PATCH)
  .route('/suggested-prompts', SUGGESTED_PROMPTS);

export default app;
