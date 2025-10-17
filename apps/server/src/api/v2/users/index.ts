import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import userIdGet from './[id]/GET';
import userIdPatch from './[id]/PATCH';
import userIdSuggestedPrompts from './[id]/suggested-prompts/GET';
import GET from './GET';
import POST from './POST';

const app = new Hono()
  // Apply authentication globally to ALL routes in this router
  .use('*', requireAuth)
  // Mount the modular routes
  .route('/', GET)
  .route('/', POST)
  .route('/:id', userIdGet)
  .route('/:id', userIdPatch)
  .route('/:id/suggested-prompts', userIdSuggestedPrompts);

export default app;
