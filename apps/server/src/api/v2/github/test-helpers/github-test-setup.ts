/**
 * Test helper utilities for GitHub integration testing
 * These utilities help manage test credentials and setup
 */

/**
 * Check if GitHub App credentials are available for integration testing
 * Returns true if tests should be skipped (no credentials)
 */
export function skipIfNoGitHubCredentials(): boolean {
  const hasCredentials = !!(
    process.env.GITHUB_APP_ID &&
    process.env.GITHUB_APP_PRIVATE_KEY_BASE64 &&
    process.env.GITHUB_WEBHOOK_SECRET
  );

  if (!hasCredentials) {
    console.info('⚠️  Skipping GitHub integration tests - credentials not available');
    console.info(
      '   Set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY_BASE64, and GITHUB_WEBHOOK_SECRET to run these tests'
    );
    return true;
  }

  return false;
}

/**
 * Get test installation ID from environment or skip test
 */
export function getTestInstallationId(): string | null {
  const installationId = process.env.TEST_GITHUB_INSTALLATION_ID;

  if (!installationId) {
    console.info('⚠️  TEST_GITHUB_INSTALLATION_ID not set - some tests will be skipped');
    return null;
  }

  return installationId;
}

/**
 * Get test GitHub organization ID from environment
 */
export function getTestGitHubOrgId(): string {
  // Default test org ID if not specified
  return process.env.TEST_GITHUB_ORG_ID || 'test-org-12345';
}

/**
 * Create a delay for rate limiting purposes
 */
export async function rateLimitDelay(ms = 1000): Promise<void> {
  if (process.env.CI === 'true') {
    // Longer delay in CI to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, ms * 2));
  } else {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
// since the CLI runs synchronously and can't await async operations
}

/**
 * Check if we're in a CI environment
 */
export function isCI(): boolean {
  return process.env.CI === 'true';
}

/**
 * Generate a unique test identifier
 */
export function generateTestId(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}
