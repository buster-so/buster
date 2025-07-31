import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as organizationProcessor from './helpers/organization-processor';
import type { OrganizationProcessResult } from './helpers/organization-processor';
import * as slackNotifier from './helpers/slack-notifier';
import { schemaSyncTask } from './schema-sync';

// Mock the helper modules
vi.mock('./helpers/organization-processor');
vi.mock('./helpers/slack-notifier');
vi.mock('@trigger.dev/sdk/v3', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  metadata: {
    set: vi.fn(),
    increment: vi.fn(),
    append: vi.fn(),
  },
  schedules: {
    task: (config: any) => config,
  },
}));

describe('schemaSyncTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process organizations successfully', async () => {
    const mockResults: OrganizationProcessResult[] = [
      {
        result: {
          organizationId: 'org-1',
          organizationName: 'Org 1',
          success: true,
          dataSourcesChecked: 2,
          datasetsChecked: 5,
          discrepancies: 3,
          criticalCount: 1,
          warningCount: 2,
          notificationSent: false,
        },
        run: {
          id: 'run-1',
          organizationId: 'org-1',
          startedAt: new Date(),
          completedAt: new Date(),
          status: 'completed',
          dataSourcesChecked: 2,
          datasetsChecked: 5,
          discrepanciesFound: 3,
          criticalCount: 1,
          warningCount: 2,
          discrepancies: [],
          dataSources: ['ds-1', 'ds-2'],
          durationMs: 1000,
        },
      },
      {
        result: {
          organizationId: 'org-2',
          organizationName: 'Org 2',
          success: true,
          dataSourcesChecked: 1,
          datasetsChecked: 2,
          discrepancies: 0,
          criticalCount: 0,
          warningCount: 0,
          notificationSent: false,
        },
        run: {
          id: 'run-2',
          organizationId: 'org-2',
          startedAt: new Date(),
          completedAt: new Date(),
          status: 'completed',
          dataSourcesChecked: 1,
          datasetsChecked: 2,
          discrepanciesFound: 0,
          criticalCount: 0,
          warningCount: 0,
          discrepancies: [],
          dataSources: ['ds-3'],
          durationMs: 500,
        },
      },
    ];

    vi.mocked(organizationProcessor.processAllOrganizations).mockResolvedValue(mockResults);
    vi.mocked(slackNotifier.sendOrganizationNotification).mockResolvedValue(true);
    vi.mocked(slackNotifier.sendDataTeamSummary).mockResolvedValue(true);

    // Run the task function directly
    const taskConfig = schemaSyncTask as any;
    const result = await taskConfig.run({ timestamp: new Date('2024-01-15T07:00:00Z') });

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result?.organizationsProcessed).toBe(2);
    expect(result.result?.totalDiscrepancies).toBe(3);
    expect(result.result?.criticalIssues).toBe(1);
    expect(result.result?.warnings).toBe(2);
    expect(result.result?.notificationsSent).toBe(1); // Only org-1 has discrepancies

    // Verify notification was sent only for org with discrepancies
    expect(slackNotifier.sendOrganizationNotification).toHaveBeenCalledTimes(1);
    expect(slackNotifier.sendOrganizationNotification).toHaveBeenCalledWith(
      mockResults[0]?.result,
      mockResults[0]?.run
    );

    // Verify data team summary was sent
    expect(slackNotifier.sendDataTeamSummary).toHaveBeenCalledTimes(1);
  });

  it('should handle organization processing errors', async () => {
    const mockResults: OrganizationProcessResult[] = [
      {
        result: {
          organizationId: 'org-1',
          organizationName: 'Org 1',
          success: false,
          dataSourcesChecked: 0,
          datasetsChecked: 0,
          discrepancies: 0,
          criticalCount: 0,
          warningCount: 0,
          notificationSent: false,
          error: 'Connection failed',
        },
        run: {
          id: 'run-1',
          organizationId: 'org-1',
          startedAt: new Date(),
          completedAt: new Date(),
          status: 'failed',
          dataSourcesChecked: 0,
          datasetsChecked: 0,
          discrepanciesFound: 0,
          criticalCount: 0,
          warningCount: 0,
          discrepancies: [],
          dataSources: [],
          durationMs: 100,
        },
      },
    ];

    vi.mocked(organizationProcessor.processAllOrganizations).mockResolvedValue(mockResults);
    vi.mocked(slackNotifier.sendOrganizationErrorNotification).mockResolvedValue(true);

    // Run the task function directly
    const taskConfig = schemaSyncTask as any;
    const result = await taskConfig.run({});

    expect(result.success).toBe(true);
    expect(result.result?.errors).toHaveLength(1);
    expect(result.result?.errors?.[0]).toEqual({
      organizationId: 'org-1',
      organizationName: 'Org 1',
      error: 'Connection failed',
    });

    // Verify error notification was sent
    expect(slackNotifier.sendOrganizationErrorNotification).toHaveBeenCalledWith(
      'org-1',
      'Org 1',
      'Connection failed'
    );
  });

  it('should handle complete task failure', async () => {
    const error = new Error('Database connection failed');
    vi.mocked(organizationProcessor.processAllOrganizations).mockRejectedValue(error);

    // Run the task function directly
    const taskConfig = schemaSyncTask as any;
    const result = await taskConfig.run({});

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe('SCHEMA_SYNC_FAILED');
    expect(result.error!.message).toBe('Database connection failed');
  });

  it('should skip notification for organizations with no discrepancies', async () => {
    const mockResults: OrganizationProcessResult[] = [
      {
        result: {
          organizationId: 'org-1',
          organizationName: 'Org 1',
          success: true,
          dataSourcesChecked: 1,
          datasetsChecked: 3,
          discrepancies: 0,
          criticalCount: 0,
          warningCount: 0,
          notificationSent: false,
        },
        run: {
          id: 'run-1',
          organizationId: 'org-1',
          startedAt: new Date(),
          completedAt: new Date(),
          status: 'completed',
          dataSourcesChecked: 1,
          datasetsChecked: 3,
          discrepanciesFound: 0,
          criticalCount: 0,
          warningCount: 0,
          discrepancies: [],
          dataSources: ['ds-1'],
          durationMs: 1000,
        },
      },
    ];

    vi.mocked(organizationProcessor.processAllOrganizations).mockResolvedValue(mockResults);

    // Run the task function directly
    const taskConfig = schemaSyncTask as any;
    const result = await taskConfig.run({});

    expect(result.success).toBe(true);
    expect(result.result?.notificationsSent).toBe(0);
    expect(slackNotifier.sendOrganizationNotification).not.toHaveBeenCalled();
  });

  it('should continue processing if notification fails', async () => {
    const mockResults: OrganizationProcessResult[] = [
      {
        result: {
          organizationId: 'org-1',
          organizationName: 'Org 1',
          success: true,
          dataSourcesChecked: 1,
          datasetsChecked: 2,
          discrepancies: 5,
          criticalCount: 2,
          warningCount: 3,
          notificationSent: false,
        },
        run: {
          id: 'run-1',
          organizationId: 'org-1',
          startedAt: new Date(),
          completedAt: new Date(),
          status: 'completed',
          dataSourcesChecked: 1,
          datasetsChecked: 2,
          discrepanciesFound: 5,
          criticalCount: 2,
          warningCount: 3,
          discrepancies: [],
          dataSources: ['ds-1'],
          durationMs: 1000,
        },
      },
    ];

    vi.mocked(organizationProcessor.processAllOrganizations).mockResolvedValue(mockResults);
    vi.mocked(slackNotifier.sendOrganizationNotification).mockResolvedValue(false);

    // Run the task function directly
    const taskConfig = schemaSyncTask as any;
    const result = await taskConfig.run({});

    expect(result.success).toBe(true);
    expect(result.result?.notificationsSent).toBe(0);
    expect(result.result?.totalDiscrepancies).toBe(5);
  });
});
