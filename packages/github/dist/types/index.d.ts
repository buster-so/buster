import { z } from 'zod';
export declare const GitHubOAuthConfigSchema: z.ZodObject<{
    clientId: z.ZodString;
    clientSecret: z.ZodString;
    redirectUri: z.ZodString;
    scopes: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
}, {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
}>;
export type GitHubOAuthConfig = z.infer<typeof GitHubOAuthConfigSchema>;
export declare const GitHubIntegrationResultSchema: z.ZodObject<{
    installationId: z.ZodString;
    appId: z.ZodOptional<z.ZodString>;
    githubOrgId: z.ZodString;
    githubOrgName: z.ZodOptional<z.ZodString>;
    accessToken: z.ZodString;
    repositoryPermissions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    installationId: string;
    githubOrgId: string;
    accessToken: string;
    appId?: string | undefined;
    githubOrgName?: string | undefined;
    repositoryPermissions?: Record<string, unknown> | undefined;
}, {
    installationId: string;
    githubOrgId: string;
    accessToken: string;
    appId?: string | undefined;
    githubOrgName?: string | undefined;
    repositoryPermissions?: Record<string, unknown> | undefined;
}>;
export type GitHubIntegrationResult = z.infer<typeof GitHubIntegrationResultSchema>;
export declare const GitHubOAuthResponseSchema: z.ZodObject<{
    access_token: z.ZodString;
    token_type: z.ZodString;
    scope: z.ZodString;
}, "strip", z.ZodTypeAny, {
    access_token: string;
    token_type: string;
    scope: string;
}, {
    access_token: string;
    token_type: string;
    scope: string;
}>;
export type GitHubOAuthResponse = z.infer<typeof GitHubOAuthResponseSchema>;
export declare const GitHubOAuthStateSchema: z.ZodObject<{
    expiresAt: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    expiresAt: number;
    metadata?: Record<string, unknown> | undefined;
}, {
    expiresAt: number;
    metadata?: Record<string, unknown> | undefined;
}>;
export type GitHubOAuthState = z.infer<typeof GitHubOAuthStateSchema>;
//# sourceMappingURL=index.d.ts.map