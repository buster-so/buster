import { createHmac } from 'node:crypto';
import { GITHUB_KEYS, getSecret } from '@buster/secrets';
import { describe, expect, it } from 'vitest';
import { skipIfNoGitHubCredentials } from '../../../../apps/server/src/api/v2/github/test-helpers/github-test-setup';
import { verifyGitHubWebhookSignature } from './webhook';

describe('GitHub Webhook Service Integration Tests', () => {
  describe('Webhook Signature Verification', () => {
    it('should verify valid webhook signature', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const webhookSecret = await getSecret(GITHUB_KEYS.GITHUB_WEBHOOK_SECRET);

      // Sample webhook payload
      const payload = {
        action: 'created',
        installation: {
          id: 12345,
          account: {
            id: 67890,
            login: 'test-org',
          },
        },
      };

      const payloadString = JSON.stringify(payload);

      // Generate valid signature
      const signature = `sha256=${createHmac('sha256', webhookSecret).update(payloadString).digest('hex')}`;

      // Should verify successfully
      const isValid = verifyGitHubWebhookSignature(payloadString, signature);
      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const webhookSecret = await getSecret(GITHUB_KEYS.GITHUB_WEBHOOK_SECRET);

      const payload = {
        action: 'created',
        installation: {
          id: 12345,
        },
      };

      const payloadString = JSON.stringify(payload);

      // Generate signature with wrong secret
      const wrongSignature = `sha256=${createHmac('sha256', 'wrong-secret').update(payloadString).digest('hex')}`;

      // Should fail verification
      const isValid = verifyGitHubWebhookSignature(payloadString, wrongSignature);
      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong format', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const webhookSecret = await getSecret(GITHUB_KEYS.GITHUB_WEBHOOK_SECRET);

      const payload = { test: 'data' };
      const payloadString = JSON.stringify(payload);

      // Wrong format signatures
      const wrongFormats = [
        'invalid-signature',
        'sha1=12345', // Wrong algorithm
        '', // Empty
        'sha256=', // Missing hash
      ];

      for (const signature of wrongFormats) {
        const isValid = verifyGitHubWebhookSignature(payloadString, signature);
        expect(isValid).toBe(false);
      }
    });

    it('should handle different payload types', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const webhookSecret = await getSecret(GITHUB_KEYS.GITHUB_WEBHOOK_SECRET);

      // Test different GitHub webhook event types
      const payloads = [
        {
          action: 'deleted',
          installation: { id: 123 },
        },
        {
          action: 'suspend',
          installation: { id: 456 },
        },
        {
          action: 'unsuspend',
          installation: { id: 789 },
        },
        {
          action: 'added',
          installation: { id: 111 },
          repositories_added: [{ id: 222, name: 'test-repo' }],
        },
      ];

      for (const payload of payloads) {
        const payloadString = JSON.stringify(payload);
        const signature = `sha256=${createHmac('sha256', webhookSecret).update(payloadString).digest('hex')}`;

        const isValid = verifyGitHubWebhookSignature(payloadString, signature);
        expect(isValid).toBe(true);
      }
    });

    it('should be consistent with repeated verifications', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const webhookSecret = await getSecret(GITHUB_KEYS.GITHUB_WEBHOOK_SECRET);

      const payload = { test: 'consistency' };
      const payloadString = JSON.stringify(payload);
      const signature = `sha256=${createHmac('sha256', webhookSecret).update(payloadString).digest('hex')}`;

      // Verify multiple times - should always return same result
      for (let i = 0; i < 5; i++) {
        const isValid = verifyGitHubWebhookSignature(payloadString, signature);
        expect(isValid).toBe(true);
      }
    });

    it('should handle large payloads', async () => {
      if (skipIfNoGitHubCredentials()) {
        return;
      }

      const webhookSecret = await getSecret(GITHUB_KEYS.GITHUB_WEBHOOK_SECRET);

      // Create a large payload similar to real GitHub webhooks
      const largePayload = {
        action: 'created',
        installation: {
          id: 12345,
          account: {
            id: 67890,
            login: 'test-org',
            type: 'Organization',
            site_admin: false,
            html_url: 'https://github.com/test-org',
          },
          repository_selection: 'all',
          access_tokens_url: 'https://api.github.com/app/installations/12345/access_tokens',
          repositories_url: 'https://api.github.com/installation/repositories',
          html_url: 'https://github.com/settings/installations/12345',
          app_id: 123,
          target_id: 67890,
          target_type: 'Organization',
          permissions: {
            actions: 'write',
            administration: 'write',
            checks: 'write',
            contents: 'write',
            deployments: 'write',
            environments: 'write',
            issues: 'write',
            metadata: 'read',
            packages: 'write',
            pages: 'write',
            pull_requests: 'write',
            repository_hooks: 'write',
            repository_projects: 'write',
            security_events: 'write',
            statuses: 'write',
            vulnerability_alerts: 'write',
          },
          events: [
            'branch_protection_rule',
            'check_run',
            'check_suite',
            'code_scanning_alert',
            'commit_comment',
            'content_reference',
            'create',
            'delete',
            'deployment',
            'deployment_review',
            'deployment_status',
            'deploy_key',
            'discussion',
            'discussion_comment',
            'fork',
            'gollum',
            'issues',
            'issue_comment',
            'label',
            'member',
            'membership',
            'milestone',
            'organization',
            'org_block',
            'page_build',
            'project',
            'project_card',
            'project_column',
            'public',
            'pull_request',
            'pull_request_review',
            'pull_request_review_comment',
            'push',
            'registry_package',
            'release',
            'repository',
            'repository_dispatch',
            'secret_scanning_alert',
            'star',
            'status',
            'team',
            'team_add',
            'watch',
            'workflow_dispatch',
            'workflow_run',
          ],
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        sender: {
          login: 'test-user',
          id: 11111,
          type: 'User',
        },
      };

      const payloadString = JSON.stringify(largePayload);
      const signature = `sha256=${createHmac('sha256', webhookSecret).update(payloadString).digest('hex')}`;

      const isValid = verifyGitHubWebhookSignature(payloadString, signature);
      expect(isValid).toBe(true);
    });
  });
});
