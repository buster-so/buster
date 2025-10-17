# GitHub API Integration

This module implements GitHub App OAuth endpoints for managing installations.

## Architecture Overview

```
github/
├── services/           # Business logic layer
│   ├── github-app.ts   # GitHub App instance creation
│   ├── handle-installation-callback.ts
│   ├── installation-state.ts
│   ├── token-storage.ts
│   └── verify-webhook-signature.ts
├── handlers/           # Request handlers
│   ├── auth-init.ts    # Initiate OAuth flow
│   ├── auth-callback.ts # Complete OAuth flow
│   ├── webhook.ts      # Handle GitHub webhooks
│   └── get-integration.ts # Get integration status
└── index.ts           # Route definitions
```

## API Endpoints

### GET `/api/v2/github/`
Get current GitHub integration status for the user's organization.

**Authentication**: Bearer token required  
**Response**: Non-sensitive integration information (connection status, installation ID, etc.)

### GET `/api/v2/github/auth/init`
Initiate the GitHub App OAuth installation flow.

**Authentication**: Bearer token required  
**Response**: Redirect URL to GitHub for app installation

### GET `/api/v2/github/auth/callback`
Complete the GitHub App installation after user returns from GitHub.

**Query Parameters**:
- `state` - Security token to verify the request
- `installation_id` - GitHub's installation ID
- `setup_action` - Optional action type (install/update)

### POST `/api/v2/github/webhook`
Webhook endpoint for GitHub App installation events.

**Authentication**: Webhook signature verification (no bearer token required)  
**Events handled**:
- `created` - New installation
- `deleted` - App uninstalled
- `suspend` - Installation suspended
- `unsuspend` - Installation reactivated

## Service Layer

### GitHub App Creation (`github-app.ts`)
```typescript
export function createGitHubApp() {
  return new App({
    appId: process.env.GH_APP_ID!,
    privateKey: Buffer.from(
      process.env.GH_APP_PRIVATE_KEY_BASE64!, 
      'base64'
    ).toString(),
  });
}
```

### Token Generation (`get-installation-token.ts`)
- Generates installation tokens (expire after 1 hour)
- Implements token caching to avoid unnecessary API calls
- Validates installation ownership before generating tokens
- Stores tokens securely in Supabase Vault

### Webhook Security (`verify-webhook-signature.ts`)
- Verifies GitHub webhook signatures using HMAC-SHA256
- Uses `X-Hub-Signature-256` header
- Requires `GH_WEBHOOK_SECRET` environment variable

### Token Storage (`token-storage.ts`)
- Integrates with Supabase Vault for secure token storage
- Never logs or exposes raw tokens
- Returns vault keys for token retrieval

## Handler Pattern

All handlers follow this pattern:
1. Extract and validate input
2. Call service layer functions
3. Handle errors with appropriate HTTP status codes
4. Return typed responses

Example:
```typescript
export async function getInstallationTokenHandler(
  installationId: string,
  user: User
): Promise<InstallationTokenResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);
  if (!userOrg) {
    throw new HTTPException(400, { 
      message: 'User has no organization' 
    });
  }

  // Verify ownership
  const hasAccess = await verifyInstallationOwnership(
    installationId, 
    userOrg.organizationId
  );
  if (!hasAccess) {
    throw new HTTPException(403, { 
      message: 'Forbidden' 
    });
  }

  // Generate token
  return await getInstallationToken(installationId);
}
```

## Error Handling

Errors are mapped to appropriate HTTP status codes:
- `INSTALLATION_NOT_FOUND` → 404
- `INSTALLATION_SUSPENDED` → 403
- `TOKEN_GENERATION_FAILED` → 500
- `DATABASE_ERROR` → 500
- `UNAUTHORIZED` → 401

## Environment Variables

Required in root `.env`:
```bash
GH_APP_ID=123456
GH_APP_PRIVATE_KEY_BASE64=<base64-encoded-private-key>
GH_WEBHOOK_SECRET=your-webhook-secret
```

## Testing

```bash
# Run all GitHub tests
turbo run test:unit --filter=@buster-app/server -- github

# Run specific test file
pnpm test:unit installation-callback.test.ts
```

### Test Coverage
- Webhook signature verification
- Installation callback processing
- Token generation and caching
- Error handling for all edge cases
- Authorization checks

## Security Considerations

1. **Webhook Verification**: All webhook requests are verified using HMAC-SHA256
2. **Token Storage**: Tokens stored in Supabase Vault, never in plain text
3. **Authorization**: Users can only access installations for their organization
4. **Token Expiry**: Installation tokens expire after 1 hour
5. **Audit Trail**: All installations tracked with userId and timestamps

## Common Workflows

### Installing the GitHub App
1. User initiates GitHub App installation
2. GitHub sends webhook to `/installation/callback`
3. Server verifies signature and processes installation
4. Integration record created with `status = 'pending'`
5. Token generated and stored in Vault
6. Status updated to `active`

### Using Tokens in Sandbox
```typescript
// In AI workflow
const token = await getInstallationTokenByOrgId(organizationId);

// Pass to sandbox
const sandbox = await createSandboxWithGitHubToken(
  runtimeContext, 
  token.token
);

// Token available as GITHUB_TOKEN env var in sandbox
```

### Cloning Private Repos
```bash
git clone https://x-access-token:${GITHUB_TOKEN}@github.com/owner/repo.git
```