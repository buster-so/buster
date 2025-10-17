import { createChat, createMessage, getActiveGithubIntegration } from '@buster/database/queries';
import { generateNewInstallationToken } from '@buster/github';
import { type githubContext, runDocsAgentAsync, runDocsAgentSync } from '@buster/sandbox';
import { GithubActionDocumentationPostSchema } from '@buster/server-shared/github';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const app = new Hono().post(
  '/',
  zValidator('json', GithubActionDocumentationPostSchema),
  async (c) => {
    console.info('GitHub actions API endpoint called with valid API key');
    const { eventContext } = c.req.valid('json');
    const apiKey = c.get('apiKey');

    if (!apiKey) {
      return c.json({ error: 'API key not found' }, 404);
    }

    // github context to pass to the agent
    const context: githubContext = {};

    console.info('Documentation request received:', {
      eventContext,
    });

    // Needs to be either a pull_request event or a push event.
    if (!eventContext || !(eventContext.pull_request || eventContext.commits)) {
      return c.json({ error: 'Invalid event. Must be a pull_request or push event.' }, 400);
    }

    if (eventContext.pull_request) {
      context.action = eventContext.action;
      context.after = eventContext.after;
      context.before = eventContext.before;
      context.prNumber = eventContext.number?.toString();
      context.repo = eventContext.repository.name;
      context.repo_url = eventContext.repository.html_url;
      context.head_branch = eventContext.pull_request.head.ref;
      context.base_branch = eventContext.pull_request.base.ref;
    } else {
      context.action = 'push';
      context.after = eventContext.after;
      context.before = eventContext.before;
      context.commits = eventContext.commits.map((commit: { id: string }) => commit.id);
      context.head_branch = eventContext.ref.split('/').pop();
      context.base_branch = eventContext.base_ref?.split('/').pop() || context.head_branch;
      context.repo = eventContext.repository.name;
      context.repo_url = eventContext.repository.html_url;
    }

    // Validate required fields
    if (!context.repo_url || !context.head_branch) {
      return c.json(
        {
          error: 'Missing required fields: repo_url and head_branch must be present',
        },
        400
      );
    }

    const repositoryUrl = context.repo_url;
    const branchName = context.head_branch;

    // Get the Github App installation token for the organization
    const installationResult = await getActiveGithubIntegration(apiKey.organizationId);

    if (!installationResult?.installationId) {
      return c.json({ error: 'No active GitHub integration found' }, 404);
    }

    const installationId = installationResult.installationId;

    // Get the Github App installation token for the organization
    const installationTokenResult = await generateNewInstallationToken(installationId);

    // Create a new chat and message for the documentation request
    const prompt = `Please take a look at the current pull request or push and update the documentation if needed.`;

    const newChat = await createChat({
      title: context.prNumber
        ? `Documentation for PR ${context.prNumber}`
        : `Documentation for push in ${context.repo}`,
      chatType: 'data_engineer',
      organizationId: apiKey.organizationId,
      userId: apiKey.ownerId,
    });

    const newMessage = await createMessage({
      chatId: newChat.id,
      content: prompt,
      userId: apiKey.ownerId,
    });

    // Kick off the documentation agent
    await runDocsAgentAsync({
      installationToken: installationTokenResult.token,
      repoUrl: repositoryUrl,
      branch: branchName,
      prompt: prompt,
      apiKey: apiKey.id,
      chatId: newChat.id,
      messageId: newMessage.id,
      context: context,
    });

    return c.json(
      {
        message: 'Kicked off documentation agent',
        messageId: newMessage.id,
      },
      202
    );
  }
);

export default app;
