export type GitHubIntegrationErrorCode =
  | 'OAUTH_INVALID_STATE'
  | 'OAUTH_TOKEN_EXCHANGE_FAILED'
  | 'INVALID_TOKEN'
  | 'TOKEN_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'INSTALLATION_NOT_FOUND'
  | 'INSUFFICIENT_PERMISSIONS';

export class GitHubIntegrationError extends Error {
  constructor(
    public code: GitHubIntegrationErrorCode,
    message: string,
    public retryable: boolean = false,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GitHubIntegrationError';
  }
}
