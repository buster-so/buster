import { GithubActionDocumentationPostSchema } from '@buster/server-shared/github';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createChat, createMessage, getActiveGithubIntegration } from '@buster/database/queries';
import { generateNewInstallationToken } from '@buster/github';
import { runDocsAgent } from '@buster/sandbox';

const app = new Hono().post(
  '/',
  zValidator('json', GithubActionDocumentationPostSchema),
  async (c) => {
    console.info('GitHub actions API endpoint called with valid API key');
    const { prNumber, branchName, repositoryUrl, headSha } = c.req.valid('json');
    const apiKey = c.get('apiKey');

    if (!apiKey) {
      return c.json({ error: 'API key not found' }, 404);
    }

    console.info('Documentation request received:', {
      prNumber,
      branchName,
      repositoryUrl,
      headSha,
    });


    // Get the Github App installation token for the organization
    const installationResult = await getActiveGithubIntegration(apiKey.organizationId);

    if (!installationResult?.installationId) {
      return c.json({ error: 'No active GitHub integration found' }, 404);
    }

    const installationId = installationResult.installationId;

    // Get the Github App installation token for the organization
    const installationTokenResult = await generateNewInstallationToken(installationId);

    // Create a new chat and message for the documentation request
    const prompt = `Please generate any new documentation for this pull request.`;

    const newChat = await createChat({
      title: `Documentation for PR ${prNumber}`,
      organizationId: apiKey.organizationId,
      userId: apiKey.ownerId,
    });

    const newMessage = await createMessage({
      chatId: newChat.id,
      content: prompt,
      userId: apiKey.ownerId,
    });

    // Kick off the documentation agent
    await runDocsAgent({
      installationToken: installationTokenResult.token,
      repoUrl: repositoryUrl,
      branch: branchName,
      prompt: prompt,
      apiKey: apiKey.id,
    });

    return c.json({ 
      message: 'Kicked off documentation agent',
      messageId: newMessage.id
     }, 202);

  }
);

export default app;
