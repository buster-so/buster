import { randomUUID } from 'node:crypto';
import { getSandboxFileTree } from '@buster/sandbox/filesystem/file-tree/get-file-tree';
import { createSandboxWithRepositories } from '@buster/sandbox/management/create-sandbox-with-repositories';
import type { ModelMessage } from 'ai';
import { initLogger } from 'braintrust';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runDocsAgentWorkflow } from './docs-agent-workflow';

describe('docs-agent-workflow integration', () => {
  let hasRequiredEnvVars: boolean;

  beforeAll(() => {
    // Initialize Braintrust logger if available
    if (process.env.BRAINTRUST_KEY) {
      initLogger({
        apiKey: process.env.BRAINTRUST_KEY,
        projectName: process.env.ENVIRONMENT || 'test',
      });
    }

    // Check if required environment variables are present
    hasRequiredEnvVars = Boolean(
      process.env.TEST_GITHUB_PAT && process.env.TEST_SAMPLE_REPO && process.env.DAYTONA_API_KEY
    );

    if (!hasRequiredEnvVars) {
      console.info(
        'Skipping integration test - TEST_GITHUB_PAT, TEST_SAMPLE_REPO, or DAYTONA_API_KEY not set'
      );
    }
  });

  afterAll(async () => {
    // Allow time for cleanup operations
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  it('should create sandbox, get file tree, and run docs workflow', async () => {
    if (!hasRequiredEnvVars) {
      console.info('Skipping test due to missing environment variables');
      return;
    }

    // Create branch name with unix timestamp
    const branchName = `test-${Date.now()}`;

    // Create sandbox with repository
    const sandbox = await createSandboxWithRepositories({
      language: 'typescript',
      repository: process.env.TEST_SAMPLE_REPO!,
      githubToken: process.env.TEST_GITHUB_PAT!,
      branchName: branchName,
    } as Parameters<typeof createSandboxWithRepositories>[0] & { repository: string });

    // Get file tree from sandbox
    const fileTree = await getSandboxFileTree(sandbox);
    console.info('File tree retrieved successfully');

    // Prepare comma-separated list of YAML files to process concurrently
    const targetYamlListString =
      process.env.TEST_TARGET_YMLS ||
      [
        'AD_CAMPAIGN_REPORTING_DAILY_AGG.yml',
        'AD_REPORTING_DAILY_AGG.yml',
        'CLOSED_INVESTMENTS.yml',
        'ECOMMERCE_FUNNEL_EVENTS.yml',
        'EVENT_VISITED_PAGE.yml',
        'EXPRESSED_INTEREST.yml',
        'GUILD_MEMBERSHIP_COHORT_RATES_BY_CALENDAR_MONTH.yml',
        'GUILD_MEMBERSHIP_COHORT_RATES_BY_START_DATE.yml',
        'GUILD_MEMBERSHIP_DAILY_AGG.yml',
        'GUILD_MEMBERSHIP_MONTHLY_AGG.yml',
        'GUILD_MEMBERSHIP_WEIGHTED_COHORT_RATES_MEMBERSHIP_MONTH_AGG.yml',
        'guild_membership_weighted_cohort_rates_membership_quarter_agg.yml',
        'GUILD_MEMBERSHIPS_EMAIL_SIGNUP_FUNNEL_AGG.yml',
        'GUILD_MEMBERSHIPS_EMAIL_SIGNUP_FUNNEL.yml',
        'GUILD_MEMBERSHIPS_V2.yml',
        'GUILD_MEMBERSHIPS.yml',
        'GUILD_RETURN_ON_AD_SPEND.yml',
        'GUILD_VOTES.yml',
        'SCENE_REACTIONS_VIEWS_AND_FAVORITES_DAILY_AGG.yml',
        'SCENE_REACTIONS.yml',
        'SHOPIFY_SALES.yml',
        'SUPPORT_TICKETS.yml',
        'THEATRICAL_SHOWTIME_OCCUPANCY_REPORT.yml',
        'THEATRICAL_TICKET_ORDER_LINE_ITEMS.yml',
        'TRANSACTION_LINE_ITEMS.yml',
        'USERS.yml',
        'VIDEO_VIEW_RETENTION.yml',
        'VIDEO_VIEWS_ALL.yml',
        'VIDEO_VIEWS_FIRST.yml',
        'VIDEO_VIEWS_OVER_30_SEC.yml',
        'WATCHLIST_ITEMS.yml',
      ].join(',');

    const targetYamlFiles = targetYamlListString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    console.info('Running docs workflow concurrently for YAML files:', targetYamlFiles);

    const results = await Promise.all(
      targetYamlFiles.map(async (yamlFile) => {
        const messages: ModelMessage[] = [
          {
            role: 'user',
            content: `I need you to add documentation to the newly initiated ${yamlFile} docs.  Here is your playboook:

          ## Phase 1: Explore Repository and Update Overview
          - [ ] Explore repo files and lineage metadata
          - [ ] Reference lineage metadata for dependencies and core entity prioritization
          - [ ] Review for completeness and thoroughness

          ## Phase 2: Identify, Verify, and Document Relationships
          - [ ] Pull historic queries to identify common joins
          - [ ] Validate frequent joins and relationships
          - [ ] Identify relationships by keywords like "id", "pk", "fk"
          - [ ] Verify each identified relationship
          - [ ] Identify self-referential relationships
          - [ ] Verify each self-referential relationship
          - [ ] Identify junction tables for many-to-many
          - [ ] Verify each many-to-many relationship
          - [ ] Document verified relationships bidirectionally in .yml files
          - [ ] Confirm all plausible relationships identified and tested
          - [ ] Confirm all verified relationships documented

          ## Phase 3: Classify Columns as Stored Value or ENUM
          - [ ] Review metadata and .sql files model-by-model
          - [ ] Identify and document Stored Value columns
          - [ ] Identify and document ENUM columns
          - [ ] Update .yml files with classifications model-by-model
          - [ ] Confirm all models were checked
          - [ ] Confirm all Stored Value columns identified correctly
          - [ ] Confirm all ENUM columns identified correctly

          ## Phase 4: Generate Model Definitions
          - [ ] Write detailed model descriptions starting with core entities, one at a time
          - [ ] Save updates to each .yml file
          - [ ] Confirm all models have descriptions
          - [ ] Review definitions for clarity to new analysts

          ## Phase 5: Generate Column Definitions
          - [ ] Write column definitions and keys, model-by-model
          - [ ] Save updates to each .yml file
          - [ ] Confirm all models were documented
          - [ ] Confirm all columns have descriptions
          - [ ] Review definitions for clarity to new analysts

          ## Phase 6: Identify and Log Clarifications
          - [ ] Assess documentation for gaps after prior phases
          - [ ] Impersonate new analyst to find missing/confusing elements
          - [ ] Impersonate user to spot unclear data request areas
          - [ ] Identify unclear key concepts or field/model distinctions
          - [ ] Log important clarification items iteratively

          ## Phase 7: Finalize and Create Pull Request
          - [ ] Review work for completeness and consistency
          - [ ] Stage changes with git
          - [ ] Push changes to branch
          - [ ] Create pull request

          The key here is that for this specific model, we want to try and cover everything we can about it. We need to document this data model better than a human. So we should look at the metadata, lineage, look at possible join columns, etc.
          `,
          },
        ];

        const workflowInput = {
          messages,
          messageId: randomUUID(),
          chatId: randomUUID(),
          userId: randomUUID(),
          organizationId: randomUUID(),
          dataSourceId: randomUUID(),
          sandbox,
        };

        const result = await runDocsAgentWorkflow(workflowInput);
        return { yamlFile, result };
      })
    );

    for (const { yamlFile, result } of results) {
      // Validate the workflow output
      expect(result).toBeDefined();
      expect(result.workflowId).toBeDefined();
      expect(result.chatId).toBeDefined();
      expect(result.messageId).toBeDefined();
      expect(result.userId).toBeDefined();
      expect(result.organizationId).toBeDefined();
      expect(result.dataSourceId).toBeDefined();

      // Check execution metrics
      expect(result.totalExecutionTimeMs).toBeGreaterThan(0);
      expect(result.startTime).toBeLessThanOrEqual(result.endTime);

      // Check workflow outputs
      expect(result.messages).toBeDefined();
      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.repositoryTree).toBeDefined();
      expect(typeof result.todos).toBe('string');

      // Check summary
      expect(result.summary).toBeDefined();

      console.info(`[${yamlFile}] Workflow completed successfully`);
      console.info(`[${yamlFile}] Execution time:`, result.totalExecutionTimeMs, 'ms');
      console.info(
        `[${yamlFile}] TODOs created:`,
        result.todos?.split('\n').filter((line) => line.includes('- [ ]')).length || 0,
        'items'
      );
    }

    // Clean up - stop the sandbox
    await sandbox.stop();
  }, 900000); // 15 minute timeout for full workflow
});
