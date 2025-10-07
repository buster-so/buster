import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { githubWebhookMiddleware } from '../../../../../middleware/github-webhook-middleware';

const app = new Hono().post('/', githubWebhookMiddleware(), async (c) => {
  const githubApp = c.get('githubApp');
  if (!githubApp) {
    throw new HTTPException(400, {
      message: 'GitHub app not found',
    });
  }

  githubApp.webhooks.on('pull_request.opened', ({ octokit, payload }) => {
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const issue_number = payload.pull_request.number;
    const username = payload.pull_request.user.login;
    console.info(`Pull request opened by ${username} in ${owner}/${repo}#${issue_number}`);
    const body = 'Merge if you are stinky!';
    return octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body,
    });
  });

  githubApp.webhooks.on('installation', ({ payload }) => {
    console.info(`Installation event received: ${payload.action}`);
    console.info('Installation event payload:', payload);
    return c.text('Installation event received and processed', 201);
  });
});

export default app;
