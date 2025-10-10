# @buster/github

GitHub App integration package for managing installations, tokens, and webhook verification.

## Features

- **GitHub App OAuth Flow**: Properly associate installations with organizations
- **Token Management**: Automatic token generation, caching, and refresh with 1-hour expiry
- **Webhook Verification**: Secure webhook signature validation using HMAC-SHA256
- **Installation Lifecycle**: Handle installation, suspension, unsuspension, and deletion events

## Installation Flow

### OAuth-based Installation (Recommended)

This flow ensures proper association between GitHub installations and your organization:

1. **Initiate Installation**: User clicks "Install GitHub App" in your application
   ```
   GET /api/v2/github/installation/initiate
   ```
   Returns a redirect URL with a secure state parameter

2. **User Installs App**: User is redirected to GitHub to install the app

3. **Complete Installation**: GitHub redirects back with state and installation_id
   ```
   GET /api/v2/github/installation/complete?state=xxx&installation_id=yyy
   ```
   Associates the installation with the user's organization

### Webhook Events

The app also handles webhook events for installation lifecycle:
- `installation.created` - New installation (requires OAuth flow for proper association)
- `installation.deleted` - App uninstalled
- `installation.suspend` - App suspended by GitHub
- `installation.unsuspend` - App unsuspended

## API Endpoints

### OAuth Flow
- `GET /api/v2/github/installation/initiate` - Start installation flow (requires auth)
- `GET /api/v2/github/installation/complete` - Complete installation (state validation)

### Token Management
- `GET /api/v2/github/installations/:installationId/token` - Get installation token (requires auth)
- `GET /api/v2/github/installations/refresh` - Refresh token for user's org (requires auth)

### Webhooks
- `POST /api/v2/github/installation/callback` - GitHub webhook endpoint (signature verified)

## Configuration

Required environment variables (set in root `.env`):
```bash
GH_APP_ID=your_app_id
GH_APP_PRIVATE_KEY_BASE64=base64_encoded_private_key
GH_WEBHOOK_SECRET=your_webhook_secret
GH_APP_NAME=your_app_name  # Used in OAuth redirect URLs
```

## Token Storage

Tokens are stored securely in Supabase Vault with automatic expiry handling:
- Tokens expire after 1 hour (GitHub limitation)
- 5-minute buffer before expiry for safety
- Automatic refresh on expired token access

## Usage

### Get Installation Token
```typescript
import { getInstallationToken } from '@buster/github';

const token = await getInstallationToken(installationId);
// Returns: { token, expires_at, permissions, repository_selection }
```

### Verify Webhook Signature
```typescript
import { verifyGitHubWebhookSignature } from '@buster/github';

const isValid = verifyGitHubWebhookSignature(payload, signature);
```

## Testing Locally

1. **Set up ngrok** for webhook forwarding:
   ```bash
   ngrok http 3002
   ```

2. **Configure GitHub App**:
   - Webhook URL: `https://your-ngrok-id.ngrok.io/api/v2/github/installation/callback`
   - Callback URL: `http://localhost:3002/api/v2/github/installation/complete`

3. **Install the App**:
   - Start from your application: `/api/v2/github/installation/initiate`
   - Complete installation on GitHub
   - Callback will associate installation with your organization

## Security

- All webhook requests are verified using HMAC-SHA256
- Installation tokens are scoped to specific permissions
- OAuth state parameters prevent CSRF attacks
- Tokens are never logged or exposed