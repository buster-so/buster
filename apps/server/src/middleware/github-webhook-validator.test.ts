import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { githubWebhookValidator } from './github-webhook-validator';

// Mock @buster/secrets
vi.mock('@buster/secrets', () => ({
  getSecret: vi.fn(),
  GITHUB_KEYS: {
    GITHUB_APP_ID: 'GITHUB_APP_ID',
    GITHUB_APP_NAME: 'GITHUB_APP_NAME',
    GITHUB_APP_PRIVATE_KEY_BASE64: 'GITHUB_APP_PRIVATE_KEY_BASE64',
    GITHUB_APP_PRIVATE_KEY_BASE: 'GITHUB_APP_PRIVATE_KEY_BASE',
    GITHUB_WEBHOOK_SECRET: 'GITHUB_WEBHOOK_SECRET',
    GITHUB_TOKEN: 'GITHUB_TOKEN',
  },
}));

// Mock the verify webhook signature from github package
vi.mock('@buster/github', () => ({
  verifyGitHubWebhookSignature: vi.fn(),
  InstallationCallbackSchema: {
    parse: vi.fn((value) => value), // Pass through for testing
  },
}));

import { InstallationCallbackSchema, verifyGitHubWebhookSignature } from '@buster/github';
import { getSecret } from '@buster/secrets';

describe('githubWebhookValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for getSecret - can be overridden in individual tests
    vi.mocked(getSecret).mockResolvedValue('test-webhook-secret');
  });
  const mockPayload = {
    action: 'created' as const,
    installation: {
      id: 123456,
      account: {
        id: 789,
        login: 'test-org',
      },
    },
  };

  const createMockContext = (signature?: string, body = mockPayload) => {
    const app = new Hono();
    app.use('*', githubWebhookValidator());
    app.post('/', (c) => {
      const payload = c.get('githubPayload');
      return c.json({ payload });
    });

    const headers: Record<string, string> = {};
    if (signature) {
      headers['X-Hub-Signature-256'] = signature;
    }

    return {
      app,
      headers,
      body: JSON.stringify(body),
    };
  };

  it('should validate a valid webhook request', async () => {
    const { app, headers, body } = createMockContext('sha256=test-signature');

    // Mock signature verification to return true
    vi.mocked(verifyGitHubWebhookSignature).mockReturnValue(true);

    // Mock InstallationCallbackSchema to return the parsed payload
    vi.mocked(InstallationCallbackSchema.parse).mockReturnValue(mockPayload);

    const res = await app.request('/', {
      method: 'POST',
      headers,
      body,
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { payload: typeof mockPayload };
    expect(data.payload).toEqual(mockPayload);
    expect(verifyGitHubWebhookSignature).toHaveBeenCalledWith(body, 'sha256=test-signature');
  });

  it('should reject request without signature header', async () => {
    const { app, body } = createMockContext(); // No signature

    const res = await app.request('/', {
      method: 'POST',
      body,
    });

    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toBe('Missing X-Hub-Signature-256 header');
  });

  it('should reject request with invalid signature', async () => {
    const { app, headers, body } = createMockContext('sha256=invalid-signature');

    // Mock signature verification to return false
    vi.mocked(verifyGitHubWebhookSignature).mockReturnValue(false);

    const res = await app.request('/', {
      method: 'POST',
      headers,
      body,
    });

    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toBe('Invalid webhook signature');
  });

  it('should reject request when webhook secret is not configured', async () => {
    const { app, headers, body } = createMockContext('sha256=test-signature');

    // Mock getSecret to reject for webhook secret
    vi.mocked(getSecret).mockRejectedValue(new Error('Secret not found'));

    const res = await app.request('/', {
      method: 'POST',
      headers,
      body,
    });

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe('GITHUB_WEBHOOK_SECRET not configured');
  });

  it('should reject request with invalid JSON payload', async () => {
    const { app, headers } = createMockContext('sha256=test-signature');

    vi.mocked(verifyGitHubWebhookSignature).mockReturnValue(true);

    const res = await app.request('/', {
      method: 'POST',
      headers,
      body: 'invalid json',
    });

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Invalid webhook payload');
  });

  it('should reject request with invalid payload schema', async () => {
    const invalidPayload = {
      action: 'created',
      // Missing required installation field - type assertion needed for test
    } as any;

    const { app, headers, body } = createMockContext('sha256=test-signature', invalidPayload);

    vi.mocked(verifyGitHubWebhookSignature).mockReturnValue(true);

    // Mock schema to throw an error for invalid payload
    vi.mocked(InstallationCallbackSchema.parse).mockImplementation(() => {
      throw new Error('Invalid payload');
    });

    const res = await app.request('/', {
      method: 'POST',
      headers,
      body,
    });

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Invalid webhook payload');
  });
});
