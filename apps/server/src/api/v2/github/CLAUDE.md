# CLAUDE.md - GitHub API Module

## Context for Claude

This module implements GitHub App OAuth endpoints. Follow these patterns and conventions consistently.

## Critical Conventions

### 1. File Organization
```
❌ DON'T: Put multiple handlers in one file
✅ DO: Each handler gets its own file

github/
├── services/       # Business logic
├── handlers/       # Request handlers (one per file)
├── __tests__/     # Test files
└── index.ts       # Route definitions only
```

### 2. Handler Pattern
```typescript
❌ DON'T: Mix business logic with HTTP handling
✅ DO: Separate concerns

// handler file
export async function handlerName(
  params: TypedParams,
  user: User
): Promise<TypedResponse> {
  // 1. Validate authorization
  // 2. Call service functions
  // 3. Handle errors with HTTPException
  // 4. Return typed response
}

// route definition
.get('/endpoint', async (c) => {
  const user = c.get('busterUser');
  const response = await handlerName(params, user);
  return c.json(response);
})
```

### 3. Service Layer Rules
```typescript
❌ DON'T: Throw HTTPException in services
✅ DO: Return errors or throw custom errors

// service function
export async function serviceFunction() {
  // Business logic only
  // No HTTP concerns
  // Return data or throw domain errors
}
```

### 4. Error Handling Pattern
```typescript
// In handlers
if (!userOrg) {
  throw new HTTPException(400, { 
    message: 'User has no organization' 
  });
}

// Use biome-ignore for status type issues
// biome-ignore lint/suspicious/noExplicitAny: HTTPException requires any
throw new HTTPException(403 as any, { 
  message: 'Forbidden' 
});
```

## Authentication Flow

### Webhook Endpoints
- No bearer token required
- Use `githubWebhookValidator` middleware
- Verify signature with X-Hub-Signature-256

### API Endpoints
- Always require bearer token
- Use `requireAuth` middleware
- Get user via `c.get('busterUser')`
- Verify organization ownership

## Testing Requirements

### Unit Tests
Each handler should have tests covering:
1. Success cases
2. Authorization failures
3. Validation errors
4. Service layer errors
5. Edge cases

### Test Structure
```typescript
describe('handlerName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle success case', async () => {
    // Mock service layer
    vi.mocked(serviceFunction).mockResolvedValue(data);
    
    // Call handler
    const result = await handler(params, user);
    
    // Verify response
    expect(result).toEqual(expected);
  });

  it('should throw 403 when unauthorized', async () => {
    // Test authorization logic
  });
});
```

## GitHub App Integration

### Token Management
- Tokens expire after 1 hour
- Store in Supabase Vault
- Cache tokens when possible
- Never log raw tokens

### Installation States
```
pending → active     # Token generated
active → suspended   # GitHub suspended
suspended → active   # GitHub unsuspended
any → revoked       # User uninstalled
```

## Common Patterns to Follow

### 1. Getting User Organization
```typescript
const userOrg = await getUserOrganizationId(user.id);
if (!userOrg) {
  throw new HTTPException(400, { 
    message: 'User has no organization' 
  });
}
```

### 2. Verifying Installation Access
```typescript
const hasAccess = await verifyInstallationOwnership(
  installationId, 
  userOrg.organizationId
);
if (!hasAccess) {
  throw new HTTPException(403, { 
    message: 'Forbidden' 
  });
}
```

### 3. Token Generation
```typescript
const token = await getInstallationToken(installationId);
// Token includes: token, expires_at, permissions
```

## Adding New Endpoints

1. Create handler file in `handlers/`
2. Add service logic in `services/`
3. Define types in `@buster/server-shared/github`
4. Add route in `index.ts`
5. Create unit tests
6. Update README.md

## Environment Variables

Required (set in root .env):
```bash
GH_APP_ID
GH_APP_PRIVATE_KEY_BASE64
GH_WEBHOOK_SECRET
```

## Common Mistakes to Avoid

1. ❌ Don't mix HTTP concerns in services
2. ❌ Don't forget to clear mocks in tests
3. ❌ Don't log sensitive data (tokens, keys)
4. ❌ Don't hard delete - use soft delete
5. ❌ Don't skip authorization checks
6. ❌ Don't use classes - use functions

## Debugging Tips

- Use ngrok for local webhook testing
- Check vault for stored tokens
- Verify webhook signatures manually if needed
- Use GitHub's webhook delivery logs
- Test with `safeParse()` for better error messages

## Integration with AI Tools

When GitHub tokens need to be passed to AI tools:
1. Fetch token from database/vault
2. Add to runtime context
3. Tools can access via `runtimeContext.get(DocsAgentContextKey.GitHubToken)`
4. Sandbox receives as GITHUB_TOKEN env var

## Running Tests

```bash
# All GitHub tests
turbo run test:unit --filter=@buster-app/server -- github

# Specific handler
pnpm test:unit installation-callback.test.ts

# With verbose output
pnpm test:unit installation-callback.test.ts --reporter=verbose
```