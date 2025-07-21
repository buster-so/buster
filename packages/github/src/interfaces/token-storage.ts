export interface IGitHubTokenStorage {
  storeToken(key: string, token: string): Promise<void>;
  getToken(key: string): Promise<string | null>;
  deleteToken(key: string): Promise<void>;
  hasToken(key: string): Promise<boolean>;
}

export interface IGitHubOAuthStateStorage {
  storeState(state: string, data: GitHubOAuthStateData): Promise<void>;
  getState(state: string): Promise<GitHubOAuthStateData | null>;
  deleteState(state: string): Promise<void>;
}

export interface GitHubOAuthStateData {
  expiresAt: number;
  metadata?: Record<string, unknown>;
}
