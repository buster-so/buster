import { GitHub } from '@buster/server-shared';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../middleware/auth';
import { githubHandler } from './handler';

const app = new Hono()
  .post('/auth/init', requireAuth, (c) => githubHandler.initiateOAuth(c))
  .get('/auth/callback', (c) => githubHandler.handleOAuthCallback(c))
  .get('/integration', requireAuth, (c) => githubHandler.getIntegration(c))
  .delete('/integration', requireAuth, (c) => githubHandler.removeIntegration(c))
  .onError((e, c) => {
    if (e instanceof GitHub.GitHubError) {
      return c.json(e.toResponse(), e.status_code);
    }
    if (e instanceof HTTPException) {
      return e.getResponse();
    }

    console.error('Unhandled error in GitHub routes:', e);
    return c.json({ error: 'Internal server error' }, 500);
  });

export default app;
