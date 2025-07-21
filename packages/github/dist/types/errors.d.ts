export type GitHubIntegrationErrorCode = 'OAUTH_INVALID_STATE' | 'OAUTH_TOKEN_EXCHANGE_FAILED' | 'INVALID_TOKEN' | 'TOKEN_NOT_FOUND' | 'NETWORK_ERROR' | 'INSTALLATION_NOT_FOUND' | 'INSUFFICIENT_PERMISSIONS';
export declare class GitHubIntegrationError extends Error {
    code: GitHubIntegrationErrorCode;
    retryable: boolean;
    context?: Record<string, unknown> | undefined;
    constructor(code: GitHubIntegrationErrorCode, message: string, retryable?: boolean, context?: Record<string, unknown> | undefined);
}
//# sourceMappingURL=errors.d.ts.map