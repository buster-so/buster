import { SANDBOX_KEYS, getSecret } from '@buster/secrets';
import type { Sandbox } from '@daytonaio/sdk';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSandbox } from '../management/create-sandbox';
import { runTypescript } from './run-typescript';

describe('runTypescript with GitHub token integration tests', () => {
  let hasApiKey: boolean;
  let sandbox: Sandbox;

  beforeAll(async () => {
    try {
      await getSecret(SANDBOX_KEYS.DAYTONA_API_KEY);
      hasApiKey = true;
    } catch {
      hasApiKey = false;
    }

    if (!hasApiKey) return;

    // Create a sandbox for the tests
    sandbox = await createSandbox({
      language: 'typescript',
    });
  });

  afterAll(async () => {
    if (!hasApiKey) return;
    // Clean up the sandbox
    await sandbox.kill();
  });

  it.skipIf(!hasApiKey)('should pass GitHub token as environment variable', async () => {
    const mockToken = 'ghs_test_token_12345';

    const code = `
      const token = process.env.GITHUB_TOKEN;
      console.log(JSON.stringify({ 
        hasToken: !!token, 
        tokenPrefix: token ? token.substring(0, 4) : null 
      }));
    `;

    const result = await runTypescript(sandbox, code, {
      env: { GITHUB_TOKEN: mockToken },
    });

    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.result.trim());
    expect(parsed.hasToken).toBe(true);
    expect(parsed.tokenPrefix).toBe('ghs_');
  });

  it.skipIf(!hasApiKey)('should use GitHub token for git operations', async () => {
    const mockToken = 'ghs_test_token_12345';

    const code = `
      const token = process.env.GITHUB_TOKEN;
      
      // Simulate building a git clone URL with the token
      const owner = 'test-owner';
      const repo = 'test-repo';
      const cloneUrl = \`https://x-access-token:\${token}@github.com/\${owner}/\${repo}.git\`;
      
      console.log(JSON.stringify({ 
        cloneUrl,
        hasToken: cloneUrl.includes('x-access-token:ghs_')
      }));
    `;

    const result = await runTypescript(sandbox, code, {
      env: { GITHUB_TOKEN: mockToken },
    });

    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.result.trim());
    expect(parsed.hasToken).toBe(true);
    expect(parsed.cloneUrl).toContain('x-access-token:ghs_');
    expect(parsed.cloneUrl).toContain('@github.com/test-owner/test-repo.git');
  });

  it.skipIf(!hasApiKey)('should handle missing GitHub token gracefully', async () => {
    const code = `
      const token = process.env.GITHUB_TOKEN;
      console.log(JSON.stringify({ 
        hasToken: !!token,
        tokenValue: token || 'not-provided'
      }));
    `;

    // Run without providing GITHUB_TOKEN
    const result = await runTypescript(sandbox, code);

    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.result.trim());
    expect(parsed.hasToken).toBe(false);
    expect(parsed.tokenValue).toBe('not-provided');
  });

  it.skipIf(!hasApiKey)(
    'should pass multiple environment variables including GitHub token',
    async () => {
      const code = `
      const githubToken = process.env.GITHUB_TOKEN;
      const customVar = process.env.CUSTOM_VAR;
      const nodeEnv = process.env.NODE_ENV;
      
      console.log(JSON.stringify({ 
        hasGitHubToken: !!githubToken,
        customVar,
        nodeEnv
      }));
    `;

      const result = await runTypescript(sandbox, code, {
        env: {
          GITHUB_TOKEN: 'ghs_test_token',
          CUSTOM_VAR: 'custom_value',
          NODE_ENV: 'test',
        },
      });

      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.result.trim());
      expect(parsed.hasGitHubToken).toBe(true);
      expect(parsed.customVar).toBe('custom_value');
      expect(parsed.nodeEnv).toBe('test');
    }
  );
});
