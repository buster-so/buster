import { SANDBOX_KEYS, getSecret } from '@buster/secrets';
import { describe, expect, it } from 'vitest';
import { createSandbox } from './create-sandbox';

describe('createSandbox integration tests', () => {
  let hasApiKey: boolean;

  beforeAll(async () => {
    try {
      await getSecret(SANDBOX_KEYS.DAYTONA_API_KEY);
      hasApiKey = true;
    } catch {
      hasApiKey = false;
    }
  });

  it.skipIf(!hasApiKey)('should create a sandbox with default language', async () => {
    const sandbox = await createSandbox();

    expect(sandbox).toBeDefined();
    expect(sandbox).toHaveProperty('id');
    expect(sandbox).toHaveProperty('process');

    sandbox.delete();
  });

  it.skipIf(!hasApiKey)('should create a sandbox with custom language', async () => {
    const sandbox = await createSandbox({ language: 'python' });

    expect(sandbox).toBeDefined();
    expect(sandbox).toHaveProperty('id');
    expect(sandbox).toHaveProperty('process');

    sandbox.delete();
  });

  it.skipIf(!hasApiKey)('should execute code in the sandbox', async () => {
    const sandbox = await createSandbox();

    const response = await sandbox.process.codeRun('console.log("Hello from test!")');

    expect(response).toBeDefined();
    expect(response.result).toBeDefined();

    sandbox.delete();
  });
});
