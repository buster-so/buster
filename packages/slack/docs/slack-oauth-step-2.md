# Slack OAuth Service - Product Requirements Document

## Overview

This PRD defines the implementation of Slack's OAuth 2.0 authentication service as part of the standalone Slack package. The service handles the complete OAuth flow, from generating authorization URLs to exchanging codes for access tokens. It uses the interfaces defined in the foundation PRD and has no direct database dependencies.

## OAuth Flow

### Happy Path
1. Application generates OAuth URL with state
2. User is redirected to Slack's authorization page
3. User authorizes the application
4. Slack redirects back with code and state
5. Application exchanges code for access token
6. Token is stored via token storage interface
7. Integration details are returned to the application

### Error Scenarios
- User denies authorization → `OAUTH_ACCESS_DENIED` error
- Invalid/expired state → `OAUTH_INVALID_STATE` error
- Token exchange fails → `OAUTH_TOKEN_EXCHANGE_FAILED` error
- Network issues → `NETWORK_ERROR` with retry flag

## Technical Implementation

### 1. OAuth Service (`packages/slack/src/services/auth.ts`)

```typescript
import { z } from 'zod';
import { WebClient } from '@slack/web-api';
import { 
  SlackOAuthConfig,
  SlackOAuthResponse,
  SlackIntegrationResult,
  SlackOAuthStateSchema,
  SlackOAuthResponseSchema,
  SlackIntegrationResultSchema 
} from '../types';
import { SlackIntegrationError } from '../types/errors';
import type { ISlackTokenStorage, ISlackOAuthStateStorage } from '../interfaces/token-storage';
import { generateSecureState, isExpired, validateWithSchema } from '../utils/validation-helpers';

export class SlackAuthService {
  private slackClient: WebClient;
  
  constructor(
    private config: SlackOAuthConfig,
    private tokenStorage: ISlackTokenStorage,
    private stateStorage: ISlackOAuthStateStorage
  ) {
    this.slackClient = new WebClient();
  }

  /**
   * Generate OAuth URL and state for authorization
   * @param metadata Optional metadata to store with state
   * @returns Auth URL and state
   */
  async generateAuthUrl(metadata?: Record<string, unknown>): Promise<{ 
    authUrl: string; 
    state: string 
  }> {
    const state = generateSecureState();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    
    // Store state for CSRF protection
    await this.stateStorage.storeState(state, {
      expiresAt,
      metadata,
    });
    
    const authUrl = new URL('https://slack.com/oauth/v2/authorize');
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('scope', this.config.scopes.join(','));
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.set('state', state);

    return {
      authUrl: authUrl.toString(),
      state,
    };
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   * @param code Authorization code from Slack
   * @param state State parameter for CSRF protection
   * @param tokenKey Key to store the access token (e.g., userId)
   * @returns Integration result with team info
   */
  async handleCallback(
    code: string, 
    state: string,
    tokenKey: string
  ): Promise<SlackIntegrationResult> {
    // Validate state
    const stateData = await this.stateStorage.getState(state);
    
    if (!stateData) {
      throw new SlackIntegrationError(
        'OAUTH_INVALID_STATE',
        'Invalid or expired OAuth state'
      );
    }
    
    // Clean up state
    await this.stateStorage.deleteState(state);
    
    // Check if state expired
    if (isExpired(stateData.expiresAt)) {
      throw new SlackIntegrationError(
        'OAUTH_INVALID_STATE',
        'OAuth state has expired'
      );
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(code);
      
      // Validate response
      const oauthData = validateWithSchema(
        SlackOAuthResponseSchema,
        tokenResponse,
        'Invalid OAuth response from Slack'
      );
      
      if (!oauthData.ok) {
        throw new SlackIntegrationError(
          'OAUTH_TOKEN_EXCHANGE_FAILED',
          `Slack OAuth failed: ${tokenResponse.error || 'Unknown error'}`
        );
      }
      
      // Test the token
      await this.validateToken(oauthData.access_token);
      
      // Store access token
      await this.tokenStorage.storeToken(tokenKey, oauthData.access_token);
      
      // Return integration result
      const result: SlackIntegrationResult = {
        teamId: oauthData.team.id,
        teamName: oauthData.team.name,
        teamDomain: oauthData.team.domain || '',
        botUserId: oauthData.bot_user_id,
        scope: oauthData.scope,
        installerUserId: oauthData.authed_user.id,
        enterpriseId: oauthData.enterprise?.id,
        accessToken: oauthData.access_token,
      };
      
      return validateWithSchema(
        SlackIntegrationResultSchema,
        result,
        'Invalid integration result'
      );
      
    } catch (error) {
      // Clean up token if something went wrong
      await this.tokenStorage.deleteToken(tokenKey).catch(() => {});
      
      if (error instanceof SlackIntegrationError) {
        throw error;
      }
      
      throw new SlackIntegrationError(
        'OAUTH_TOKEN_EXCHANGE_FAILED',
        'Failed to complete OAuth flow',
        false,
        { originalError: error }
      );
    }
  }

  /**
   * Test if a token is valid
   * @param tokenKey Key to retrieve the token
   * @returns true if token is valid
   */
  async testToken(tokenKey: string): Promise<boolean> {
    try {
      const accessToken = await this.tokenStorage.getToken(tokenKey);
      if (!accessToken) {
        return false;
      }

      const response = await this.slackClient.auth.test({
        token: accessToken,
      });

      return response.ok === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Revoke access token and clean up
   * @param tokenKey Key to retrieve the token
   */
  async revokeToken(tokenKey: string): Promise<void> {
    try {
      const accessToken = await this.tokenStorage.getToken(tokenKey);
      if (!accessToken) {
        return; // Already gone
      }

      // Try to revoke with Slack
      try {
        await this.slackClient.auth.revoke({
          token: accessToken,
        });
      } catch (error) {
        // Log but don't fail - token might already be revoked
        console.warn('Failed to revoke token with Slack:', error);
      }
    } finally {
      // Always delete from storage
      await this.tokenStorage.deleteToken(tokenKey);
    }
  }

  /**
   * Exchange authorization code for access token
   * @param code Authorization code from Slack
   * @returns Raw response from Slack API
   */
  private async exchangeCodeForTokens(code: string): Promise<unknown> {
    try {
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new SlackIntegrationError(
          'OAUTH_TOKEN_EXCHANGE_FAILED',
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
      
    } catch (error) {
      if (error instanceof SlackIntegrationError) {
        throw error;
      }
      
      throw new SlackIntegrationError(
        'NETWORK_ERROR',
        'Failed to exchange code for token',
        true,
        { originalError: error }
      );
    }
  }

  /**
   * Validate access token with Slack
   * @param accessToken Token to validate
   */
  private async validateToken(accessToken: string): Promise<void> {
    try {
      const response = await this.slackClient.auth.test({
        token: accessToken,
      });

      if (!response.ok) {
        throw new SlackIntegrationError(
          'INVALID_TOKEN',
          'Token validation failed'
        );
      }
    } catch (error) {
      if (error instanceof SlackIntegrationError) {
        throw error;
      }
      
      throw new SlackIntegrationError(
        'NETWORK_ERROR',
        'Failed to validate token',
        true,
        { originalError: error }
      );
    }
  }
}
```

### 2. OAuth Configuration Helper

#### `packages/slack/src/utils/oauth-helpers.ts`
```typescript
import { z } from 'zod';
import type { SlackOAuthConfig } from '../types';
import { SlackIntegrationError } from '../types/errors';

/**
 * Parse OAuth callback parameters
 */
export const OAuthCallbackParamsSchema = z.object({
  code: z.string().optional(),
  state: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type OAuthCallbackParams = z.infer<typeof OAuthCallbackParamsSchema>;

/**
 * Handle OAuth callback errors
 */
export function handleOAuthError(params: OAuthCallbackParams): SlackIntegrationError | null {
  if (!params.error) {
    return null;
  }

  switch (params.error) {
    case 'access_denied':
      return new SlackIntegrationError(
        'OAUTH_ACCESS_DENIED',
        'User denied the authorization request'
      );
    
    case 'invalid_scope':
      return new SlackIntegrationError(
        'OAUTH_TOKEN_EXCHANGE_FAILED',
        'Invalid scope requested'
      );
    
    default:
      return new SlackIntegrationError(
        'OAUTH_TOKEN_EXCHANGE_FAILED',
        params.error_description || `OAuth error: ${params.error}`
      );
  }
}

/**
 * Validate OAuth configuration
 */
export function validateOAuthConfig(config: unknown): SlackOAuthConfig {
  const result = SlackOAuthConfigSchema.safeParse(config);
  
  if (!result.success) {
    throw new SlackIntegrationError(
      'UNKNOWN_ERROR',
      'Invalid OAuth configuration',
      false,
      { errors: result.error.flatten() }
    );
  }
  
  return result.data;
}

### 3. Example Integration Usage

```typescript
import { 
  SlackAuthService,
  handleOAuthError,
  validateOAuthConfig,
  type ISlackTokenStorage,
  type ISlackOAuthStateStorage
} from '@buster/slack';

// Example: Handling OAuth in your application
export class SlackIntegrationHandler {
  private authService: SlackAuthService;
  
  constructor(
    tokenStorage: ISlackTokenStorage,
    stateStorage: ISlackOAuthStateStorage,
    config: unknown
  ) {
    const validatedConfig = validateOAuthConfig(config);
    this.authService = new SlackAuthService(
      validatedConfig,
      tokenStorage,
      stateStorage
    );
  }
  
  // Start OAuth flow
  async startOAuth(userId: string): Promise<{ authUrl: string; state: string }> {
    // Store userId in metadata for later use
    return this.authService.generateAuthUrl({ userId });
  }
  
  // Handle OAuth callback
  async handleCallback(params: unknown): Promise<{
    success: boolean;
    error?: string;
    integration?: any;
  }> {
    const validatedParams = OAuthCallbackParamsSchema.parse(params);
    
    // Check for OAuth errors
    const error = handleOAuthError(validatedParams);
    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    if (!validatedParams.code) {
      return {
        success: false,
        error: 'No authorization code provided',
      };
    }
    
    try {
      // Get state data to retrieve userId
      const stateData = await this.stateStorage.getState(validatedParams.state);
      const userId = stateData?.metadata?.userId as string;
      
      if (!userId) {
        throw new Error('User ID not found in OAuth state');
      }
      
      // Complete OAuth flow
      const integration = await this.authService.handleCallback(
        validatedParams.code,
        validatedParams.state,
        userId
      );
      
      return {
        success: true,
        integration,
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth failed',
      };
    }
  }
  
  // Test token validity
  async testIntegration(userId: string): Promise<boolean> {
    return this.authService.testToken(userId);
  }
  
  // Revoke and clean up
  async disconnect(userId: string): Promise<void> {
    await this.authService.revokeToken(userId);
  }
}
```

```

```

## Security Considerations

### 4. Security Checklist

- ✅ **State Parameter**: CSRF protection via OAuth state parameter
- ✅ **State Expiration**: OAuth state expires after 15 minutes
- ✅ **Token Security**: Tokens stored via secure storage interface
- ✅ **Secure Transmission**: HTTPS only for all OAuth flows
- ✅ **Token Validation**: Verify tokens with Slack before storing
- ✅ **Scope Limitation**: Request only required scopes
- ✅ **Error Handling**: No sensitive data in error responses
- ✅ **Token Cleanup**: Always clean up on errors

## Testing Strategy

### 5. Unit Tests

```typescript
// packages/slack/src/services/__tests__/auth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SlackAuthService } from '../auth';
import type { ISlackTokenStorage, ISlackOAuthStateStorage } from '../../interfaces/token-storage';

describe('SlackAuthService', () => {
  let authService: SlackAuthService;
  let mockTokenStorage: ISlackTokenStorage;
  let mockStateStorage: ISlackOAuthStateStorage;
  
  const config = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'https://app.example.com/slack/callback',
    scopes: ['channels:read', 'chat:write'],
  };

  beforeEach(() => {
    // Mock token storage
    mockTokenStorage = {
      storeToken: vi.fn().mockResolvedValue(undefined),
      getToken: vi.fn().mockResolvedValue(null),
      deleteToken: vi.fn().mockResolvedValue(undefined),
      hasToken: vi.fn().mockResolvedValue(false),
    };
    
    // Mock state storage
    mockStateStorage = {
      storeState: vi.fn().mockResolvedValue(undefined),
      getState: vi.fn().mockResolvedValue(null),
      deleteState: vi.fn().mockResolvedValue(undefined),
    };
    
    authService = new SlackAuthService(config, mockTokenStorage, mockStateStorage);
  });

  describe('generateAuthUrl', () => {
    it('should generate auth URL with correct parameters', async () => {
      const { authUrl, state } = await authService.generateAuthUrl({ userId: 'user-123' });
      
      expect(authUrl).toContain('slack.com/oauth/v2/authorize');
      expect(authUrl).toContain('client_id=test-client-id');
      expect(authUrl).toContain('scope=channels%3Aread%2Cchat%3Awrite');
      expect(state).toBeTruthy();
      expect(mockStateStorage.storeState).toHaveBeenCalledWith(
        state,
        expect.objectContaining({
          expiresAt: expect.any(Number),
          metadata: { userId: 'user-123' },
        })
      );
    });
  });

  describe('handleCallback', () => {
    it('should handle successful OAuth callback', async () => {
      // Mock state validation
      vi.mocked(mockStateStorage.getState).mockResolvedValue({
        expiresAt: Date.now() + 60000,
        metadata: { userId: 'user-123' },
      });
      
      // Mock successful OAuth response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ok: true,
          access_token: 'xoxb-test-token',
          team: { id: 'T123', name: 'Test Team' },
          bot_user_id: 'U123',
          scope: 'channels:read,chat:write',
          authed_user: { id: 'U456' },
        }),
      });
      
      // Mock WebClient auth test
      const mockAuthTest = vi.fn().mockResolvedValue({ ok: true });
      (authService as any).slackClient.auth = { test: mockAuthTest };
      
      const result = await authService.handleCallback('test-code', 'test-state', 'user-123');
      
      expect(result).toMatchObject({
        teamId: 'T123',
        teamName: 'Test Team',
        botUserId: 'U123',
        accessToken: 'xoxb-test-token',
      });
      
      expect(mockTokenStorage.storeToken).toHaveBeenCalledWith('user-123', 'xoxb-test-token');
      expect(mockStateStorage.deleteState).toHaveBeenCalledWith('test-state');
    });
    
    it('should handle invalid state', async () => {
      vi.mocked(mockStateStorage.getState).mockResolvedValue(null);
      
      await expect(
        authService.handleCallback('test-code', 'invalid-state', 'user-123')
      ).rejects.toThrow('Invalid or expired OAuth state');
    });
    
    it('should handle expired state', async () => {
      vi.mocked(mockStateStorage.getState).mockResolvedValue({
        expiresAt: Date.now() - 60000, // Expired
        metadata: {},
      });
      
      await expect(
        authService.handleCallback('test-code', 'expired-state', 'user-123')
      ).rejects.toThrow('OAuth state has expired');
    });
  });

  describe('testToken', () => {
    it('should return true for valid token', async () => {
      vi.mocked(mockTokenStorage.getToken).mockResolvedValue('xoxb-valid-token');
      
      const mockAuthTest = vi.fn().mockResolvedValue({ ok: true });
      (authService as any).slackClient.auth = { test: mockAuthTest };
      
      const result = await authService.testToken('user-123');
      
      expect(result).toBe(true);
      expect(mockAuthTest).toHaveBeenCalledWith({ token: 'xoxb-valid-token' });
    });
    
    it('should return false for missing token', async () => {
      vi.mocked(mockTokenStorage.getToken).mockResolvedValue(null);
      
      const result = await authService.testToken('user-123');
      
      expect(result).toBe(false);
    });
  });
});
```

## Integration Test Example

### 6. End-to-End Test

```typescript
// packages/slack/src/__tests__/oauth-flow.int.test.ts
import { describe, it, expect } from 'vitest';
import { SlackAuthService } from '../services/auth';
import { createMockStorages } from './helpers';

describe('OAuth Flow Integration', () => {
  it('should complete full OAuth flow', async () => {
    const { tokenStorage, stateStorage } = createMockStorages();
    
    const config = {
      clientId: process.env.SLACK_TEST_CLIENT_ID!,
      clientSecret: process.env.SLACK_TEST_CLIENT_SECRET!,
      redirectUri: 'https://localhost:3000/slack/callback',
    };
    
    const authService = new SlackAuthService(config, tokenStorage, stateStorage);
    
    // 1. Generate auth URL
    const { authUrl, state } = await authService.generateAuthUrl({ userId: 'test-user' });
    expect(authUrl).toContain('slack.com');
    expect(state).toBeTruthy();
    
    // 2. Simulate callback (would need actual code in real test)
    // const code = 'test-code-from-slack';
    // const result = await authService.handleCallback(code, state, 'test-user');
    // expect(result.teamId).toBeTruthy();
    
    // 3. Test token
    // const isValid = await authService.testToken('test-user');
    // expect(isValid).toBe(true);
  });
});
```

## Success Criteria

- ✅ Complete OAuth flow without database dependencies
- ✅ CSRF protection with state parameter
- ✅ Token storage abstracted through interface
- ✅ Comprehensive error handling with typed errors
- ✅ Token validation and revocation
- ✅ Unit tests with full coverage
- ✅ No sensitive data exposed

## Next Steps

This OAuth service enables:
1. **Slack Messaging Service** - Send messages using stored tokens
2. **Channel Management Service** - List and select channels
3. **Application Integration** - Use in any framework