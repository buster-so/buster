import { Octokit } from '@octokit/rest';
import type { IGitHubOAuthStateStorage, IGitHubTokenStorage } from '../interfaces/token-storage';
import { type GitHubIntegrationResult, type GitHubOAuthConfig } from '../types';
export declare class GitHubAuthService {
    private config;
    private tokenStorage;
    private stateStorage;
    private githubClient;
    constructor(config: GitHubOAuthConfig, tokenStorage: IGitHubTokenStorage, stateStorage: IGitHubOAuthStateStorage, client?: Octokit);
    generateAuthUrl(metadata?: Record<string, unknown>): Promise<{
        authUrl: string;
        state: string;
    }>;
    handleCallback(code: string, state: string, tokenKey: string): Promise<GitHubIntegrationResult>;
    testToken(tokenKey: string): Promise<boolean>;
    revokeToken(tokenKey: string): Promise<void>;
    getGitHubClient(tokenKey: string): Promise<Octokit>;
    private exchangeCodeForTokens;
    private validateToken;
    private getInstallationInfo;
}
//# sourceMappingURL=auth.d.ts.map