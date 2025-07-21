import { z } from 'zod';

export const GitHubInitiateOAuthSchema = z.object({
  returnUrl: z.string().optional(),
  source: z.string().optional(),
  projectId: z.string().uuid().optional(),
});

export type GitHubInitiateOAuthRequest = z.infer<typeof GitHubInitiateOAuthSchema>;

export interface GitHubInitiateOAuthResponse {
  authUrl: string;
  state: string;
}

export const GitHubOAuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type GitHubOAuthCallbackRequest = z.infer<typeof GitHubOAuthCallbackSchema>;

export interface GitHubOAuthCallbackResponse {
  success: boolean;
  redirectUrl?: string;
  error?: string;
}

export interface GitHubGetIntegrationResponse {
  connected: boolean;
  status?: 'connected' | 'disconnected' | 're_install_required';
  integration?: {
    id: string;
    orgName: string;
    installedAt: string;
    lastUsedAt?: string;
    repositoryPermissions?: Record<string, unknown>;
  };
}

export interface GitHubRemoveIntegrationResponse {
  success: boolean;
  error?: string;
}

export class GitHubError extends Error {
  constructor(
    public override message: string,
    public status_code: number = 500,
    public error_code?: string
  ) {
    super(message);
    this.name = 'GitHubError';
  }

  toResponse(): GitHubErrorResponse {
    return {
      error: this.message,
      ...(this.error_code && { error_code: this.error_code }),
    };
  }
}

export interface GitHubErrorResponse {
  error: string;
  error_code?: string | undefined;
}
