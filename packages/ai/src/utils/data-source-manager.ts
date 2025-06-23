import { DataSource } from '@buster/data-source';
import type { Credentials } from '@buster/data-source';
import { db } from '@buster/database';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

/**
 * DataSource manager for workflow-level connection reuse.
 * This prevents creating multiple DataSource instances (and thus multiple connections)
 * for the same data source within a single workflow execution.
 */
export class WorkflowDataSourceManager {
  private dataSources: Map<string, DataSource> = new Map();
  private workflowId: string;
  private createdAt: number;

  constructor(workflowId: string) {
    this.workflowId = workflowId;
    this.createdAt = Date.now();
  }

  /**
   * Get or create a DataSource instance for the given data source ID
   */
  async getDataSource(dataSourceId: string): Promise<DataSource> {
    // Check if we already have a DataSource for this ID
    const existingDataSource = this.dataSources.get(dataSourceId);
    if (existingDataSource) {
      return existingDataSource;
    }

    // Create new DataSource

    const credentials = await this.getDataSourceCredentials(dataSourceId);
    const dataSource = new DataSource({
      dataSources: [
        {
          name: `datasource-${dataSourceId}`,
          type: credentials.type,
          credentials: credentials,
        },
      ],
      defaultDataSource: `datasource-${dataSourceId}`,
    });

    // Cache for future use within this workflow
    this.dataSources.set(dataSourceId, dataSource);

    // Successfully created new DataSource

    return dataSource;
  }

  /**
   * Get data source credentials from vault
   */
  private async getDataSourceCredentials(dataSourceId: string): Promise<Credentials> {
    try {
      // Query the vault to get the credentials
      const secretResult = await db.execute(
        sql`SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ${dataSourceId} LIMIT 1`
      );

      if (!secretResult.length || !secretResult[0]?.decrypted_secret) {
        throw new Error('No credentials found for the specified data source');
      }

      const secretString = secretResult[0].decrypted_secret as string;

      // Parse the credentials JSON
      const credentials = JSON.parse(secretString) as Credentials;
      return credentials;
    } catch (error) {
      console.error('Error getting data source credentials:', error);

      // Provide more specific error messages based on error type
      if (error instanceof z.ZodError) {
        throw new Error(
          'The data source credentials are not in the expected format. Please reconfigure your data source.'
        );
      }

      throw new Error(
        `Unable to retrieve data source credentials: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please contact support if this issue persists.`
      );
    }
  }

  /**
   * Close all DataSource connections managed by this workflow
   */
  async closeAll(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [_dataSourceId, dataSource] of this.dataSources) {
      promises.push(
        dataSource.close().catch(() => {
          // Silently handle close errors
        })
      );
    }

    await Promise.all(promises);
    this.dataSources.clear();
  }

  /**
   * Get statistics about managed data sources
   */
  getStats() {
    return {
      workflowId: this.workflowId,
      dataSourceCount: this.dataSources.size,
      dataSourceIds: Array.from(this.dataSources.keys()),
      uptime: Date.now() - this.createdAt,
    };
  }
}

// Global registry of workflow data source managers
const workflowManagers = new Map<string, WorkflowDataSourceManager>();

/**
 * Get or create a DataSourceManager for a workflow
 */
export function getWorkflowDataSourceManager(workflowId: string): WorkflowDataSourceManager {
  if (!workflowManagers.has(workflowId)) {
    const manager = new WorkflowDataSourceManager(workflowId);
    workflowManagers.set(workflowId, manager);
  }
  const manager = workflowManagers.get(workflowId);
  if (!manager) {
    throw new Error(`Failed to get workflow manager for ${workflowId}`);
  }
  return manager;
}

/**
 * Clean up a workflow's DataSourceManager
 */
export async function cleanupWorkflowDataSources(workflowId: string): Promise<void> {
  const manager = workflowManagers.get(workflowId);
  if (manager) {
    await manager.closeAll();
    workflowManagers.delete(workflowId);
  }
}

/**
 * Get statistics for all workflow managers
 */
export function getAllWorkflowStats() {
  const stats: Record<string, ReturnType<WorkflowDataSourceManager['getStats']>> = {};
  for (const [workflowId, manager] of workflowManagers.entries()) {
    stats[workflowId] = manager.getStats();
  }
  return stats;
}

/**
 * Clean up old workflow managers (e.g., those older than 1 hour)
 */
export async function cleanupOldWorkflowManagers(maxAge = 3600000): Promise<void> {
  const toCleanup: string[] = [];

  for (const [workflowId, manager] of workflowManagers.entries()) {
    const stats = manager.getStats();
    if (stats.uptime > maxAge) {
      toCleanup.push(workflowId);
    }
  }

  for (const workflowId of toCleanup) {
    // biome-ignore lint/suspicious/noConsoleLog: Dallin had this here
    console.log(`[WorkflowDataSourceManager] Cleaning up old workflow manager: ${workflowId}`);
    await cleanupWorkflowDataSources(workflowId);
  }
}
