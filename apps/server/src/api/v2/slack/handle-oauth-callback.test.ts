import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleOAuthCallbackHandler } from './handle-oauth-callback';

const mockSlackOAuthService = {
  handleOAuthCallback: vi.fn(),
};

vi.mock('./services/slack-oauth-service', () => ({
  createSlackOAuthService: vi.fn(() => mockSlackOAuthService),
}));

describe('handleOAuthCallbackHandler', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      req: {
        query: vi.fn(),
      },
      redirect: vi.fn(),
    };
  });

  it('should redirect on user denial', async () => {
    mockContext.req.query.mockReturnValue({ error: 'access_denied' });

    await handleOAuthCallbackHandler(mockContext);

    expect(mockContext.redirect).toHaveBeenCalledWith(
      '/app/settings/integrations?status=cancelled'
    );
  });

  it('should redirect on invalid parameters', async () => {
    mockContext.req.query.mockReturnValue({ invalid: 'params' });

    await handleOAuthCallbackHandler(mockContext);

    expect(mockContext.redirect).toHaveBeenCalledWith(
      '/app/settings/integrations?status=error&error=invalid_parameters'
    );
  });

  it('should handle successful OAuth callback', async () => {
    mockContext.req.query.mockReturnValue({
      code: 'test-code',
      state: 'test-state',
    });

    const mockResult = {
      success: true,
      integrationId: 'integration-123',
      teamName: 'Test Workspace',
      metadata: { returnUrl: '/dashboard' },
    };
    vi.mocked(mockSlackOAuthService.handleOAuthCallback).mockResolvedValue(mockResult);

    await handleOAuthCallbackHandler(mockContext);

    expect(mockSlackOAuthService.handleOAuthCallback).toHaveBeenCalledWith({
      code: 'test-code',
      state: 'test-state',
    });
    expect(mockContext.redirect).toHaveBeenCalledWith(
      '/dashboard?status=success&workspace=Test%20Workspace'
    );
  });

  it('should handle failed OAuth callback', async () => {
    mockContext.req.query.mockReturnValue({
      code: 'test-code',
      state: 'test-state',
    });

    const mockResult = {
      success: false,
      integrationId: '',
      error: 'invalid_state',
    };
    vi.mocked(mockSlackOAuthService.handleOAuthCallback).mockResolvedValue(mockResult);

    await handleOAuthCallbackHandler(mockContext);

    expect(mockContext.redirect).toHaveBeenCalledWith(
      '/app/settings/integrations?status=error&error=invalid_state'
    );
  });
});
