import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '@buster/server-shared/chats';
import { hasFailureIndicators, hasFileFailureIndicators } from './database/types';

// File tracking types
export interface ExtractedFile {
  id: string;
  fileType: 'metric' | 'dashboard';
  fileName: string;
  status: 'completed' | 'failed' | 'loading';
  ymlContent?: string;
  operation?: 'created' | 'modified' | undefined; // Track if file was created or modified
  versionNumber?: number | undefined; // Version number from the file operation
  containedInDashboards?: string[]; // Dashboard IDs that contain this metric (for metrics only)
}

/**
 * Extract successfully created/modified files from reasoning history
 * Enhanced with multiple safety checks to prevent failed files from being included
 */
export function extractFilesFromReasoning(
  reasoningHistory: ChatMessageReasoningMessage[]
): ExtractedFile[] {
  const files: ExtractedFile[] = [];

  for (const entry of reasoningHistory) {
    // Multi-layer safety checks:
    // 1. Must be a files entry with completed status
    // 2. Must not have any failure indicators (additional safety net)
    // 3. Individual files must have completed status
    if (
      entry.type === 'files' &&
      entry.status === 'completed' &&
      entry.files &&
      !hasFailureIndicators(entry)
    ) {
      // Detect operation type from the entry title
      const operation = detectOperationType(entry.title);

      for (const fileId of entry.file_ids || []) {
        const file = entry.files[fileId];

        // Enhanced file validation:
        // - File must exist and have completed status
        // - File must not have error indicators
        // - File must have required properties (file_type, file_name)
        if (
          file &&
          file.status === 'completed' &&
          file.file_type &&
          file.file_name &&
          !hasFileFailureIndicators(file)
        ) {
          files.push({
            id: fileId,
            fileType: file.file_type as 'metric' | 'dashboard',
            fileName: file.file_name,
            status: 'completed',
            ymlContent: file.file?.text || '',
            operation: operation || undefined,
            versionNumber: file.version_number || undefined,
          });
        } else {
          // Log why file was rejected for debugging
          console.warn(`Rejecting file for response: ${fileId}`, {
            fileId,
            fileName: file?.file_name || 'unknown',
            fileStatus: file?.status || 'unknown',
            hasFile: !!file,
            hasFileType: !!file?.file_type,
            hasFileName: !!file?.file_name,
            hasFailureIndicators: file ? hasFileFailureIndicators(file) : false,
            entryId: entry.id,
          });
        }
      }
    }
  }

  // Build metric-to-dashboard relationships
  buildMetricToDashboardRelationships(files);

  return files;
}

/**
 * Detect if a file was created or modified based on the entry title
 */
function detectOperationType(title?: string): 'created' | 'modified' | undefined {
  if (!title) return undefined;

  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('created') || lowerTitle.includes('creating')) {
    return 'created';
  }
  if (lowerTitle.includes('modified') || lowerTitle.includes('modifying')) {
    return 'modified';
  }

  return undefined;
}

/**
 * Parse dashboard YML content to extract metric IDs
 */
function extractMetricIdsFromDashboard(ymlContent: string): string[] {
  try {
    // First try to parse as JSON (for test data and already parsed content)
    let dashboardData: unknown;
    try {
      dashboardData = JSON.parse(ymlContent);
    } catch {
      // If JSON parsing fails, try parsing as YAML
      // Since we don't have a YAML parser imported here, we'll use a simple regex approach
      // to extract metric IDs from the YAML content
      const metricIds: string[] = [];

      // Look for UUID patterns in the content
      // This regex matches UUIDs in the format: id: "uuid" or id: uuid
      const uuidRegex =
        /id:\s*["']?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})["']?/gi;
      let match: RegExpExecArray | null = null;

      match = uuidRegex.exec(ymlContent);
      while (match !== null) {
        if (match[1]) {
          metricIds.push(match[1]);
        }
        match = uuidRegex.exec(ymlContent);
      }

      // Remove duplicates
      return [...new Set(metricIds)];
    }

    // If we successfully parsed as JSON, extract metric IDs from the structure
    const metricIds: string[] = [];

    if (
      dashboardData &&
      typeof dashboardData === 'object' &&
      'rows' in dashboardData &&
      Array.isArray(dashboardData.rows)
    ) {
      for (const row of dashboardData.rows) {
        if (row && typeof row === 'object' && 'items' in row && Array.isArray(row.items)) {
          for (const item of row.items) {
            if (item && typeof item === 'object' && 'id' in item && typeof item.id === 'string') {
              metricIds.push(item.id);
            }
          }
        }
      }
    }

    return metricIds;
  } catch (error) {
    console.warn('Failed to parse dashboard content for metric extraction:', error);
    return [];
  }
}

/**
 * Build metric-to-dashboard relationships from extracted files
 */
function buildMetricToDashboardRelationships(files: ExtractedFile[]): void {
  // First pass: collect all dashboard-to-metric mappings
  const dashboardToMetrics = new Map<string, string[]>();

  for (const file of files) {
    if (file.fileType === 'dashboard' && file.ymlContent) {
      const metricIds = extractMetricIdsFromDashboard(file.ymlContent);
      if (metricIds.length > 0) {
        dashboardToMetrics.set(file.id, metricIds);
      }
    }
  }

  // Second pass: add dashboard relationships to metrics
  for (const file of files) {
    if (file.fileType === 'metric') {
      file.containedInDashboards = [];

      // Check which dashboards contain this metric
      for (const [dashboardId, metricIds] of dashboardToMetrics) {
        if (metricIds.includes(file.id)) {
          file.containedInDashboards.push(dashboardId);
        }
      }
    }
  }
}

/**
 * Apply intelligent selection logic for files to return
 * Enhanced priority logic that considers modified files and dashboard-metric relationships
 */
export function selectFilesForResponse(
  files: ExtractedFile[],
  dashboardContext?: Array<{
    id: string;
    name: string;
    versionNumber: number;
    metricIds: string[];
  }>
): ExtractedFile[] {
  // Debug logging
  console.info('[File Selection] Starting file selection:', {
    totalFiles: files.length,
    dashboardContextCount: dashboardContext?.length || 0,
    dashboardContextProvided: dashboardContext !== undefined,
    dashboardContextIsArray: Array.isArray(dashboardContext),
    fileTypes: files.map((f) => ({ id: f.id, type: f.fileType, operation: f.operation })),
  });

  // Additional debug logging for dashboard context
  if (dashboardContext === undefined) {
    console.info('[File Selection] Dashboard context is undefined');
  } else if (dashboardContext === null) {
    console.info('[File Selection] Dashboard context is null');
  } else if (dashboardContext.length === 0) {
    console.info('[File Selection] Dashboard context is empty array');
  } else {
    console.info('[File Selection] Dashboard context details:', {
      dashboardCount: dashboardContext.length,
      dashboards: dashboardContext.map((d) => ({
        id: d.id,
        name: d.name,
        metricCount: d.metricIds.length,
        metricIds: d.metricIds,
      })),
    });
  }

  // Separate dashboards and metrics
  const dashboards = files.filter((f) => f.fileType === 'dashboard');
  const metrics = files.filter((f) => f.fileType === 'metric');

  console.info('[File Selection] File breakdown:', {
    dashboards: dashboards.length,
    metrics: metrics.length,
    modifiedMetrics: metrics.filter((m) => m.operation === 'modified').length,
  });

  // Track which dashboards need to be included due to modified metrics
  const dashboardsToInclude = new Set<string>();
  const contextDashboardsToInclude: ExtractedFile[] = [];

  // First, check if any modified metrics belong to dashboards from the current session
  for (const metric of metrics) {
    if (metric.operation === 'modified' && metric.containedInDashboards) {
      // This metric was modified and belongs to dashboard(s)
      for (const dashboardId of metric.containedInDashboards) {
        // Check if this dashboard exists in our current file set
        const dashboardExists = files.some(
          (f) => f.id === dashboardId && f.fileType === 'dashboard'
        );
        if (dashboardExists) {
          dashboardsToInclude.add(dashboardId);
        }
      }
    }
  }

  // Second, check if any modified metrics belong to dashboards from the database context
  if (dashboardContext && dashboardContext.length > 0) {
    for (const metric of metrics) {
      if (metric.operation === 'modified') {
        console.info('[File Selection] Found modified metric:', {
          metricId: metric.id,
          metricName: metric.fileName,
          checkingAgainstDashboards: dashboardContext.length,
        });

        // Check if this metric ID is in any dashboard from context
        for (const contextDashboard of dashboardContext) {
          console.info('[File Selection] Checking dashboard:', {
            dashboardId: contextDashboard.id,
            dashboardName: contextDashboard.name,
            dashboardMetricIds: contextDashboard.metricIds,
            lookingForMetricId: metric.id,
            metricIdInDashboard: contextDashboard.metricIds.includes(metric.id),
          });
          
          if (contextDashboard.metricIds.includes(metric.id)) {
            console.info('[File Selection] Modified metric found in dashboard:', {
              metricId: metric.id,
              dashboardId: contextDashboard.id,
              dashboardName: contextDashboard.name,
            });

            // Convert context dashboard to ExtractedFile format
            const dashboardFile: ExtractedFile = {
              id: contextDashboard.id,
              fileType: 'dashboard',
              fileName: contextDashboard.name,
              status: 'completed',
              versionNumber: contextDashboard.versionNumber,
              containedInDashboards: [],
              operation: undefined, // These are existing dashboards, not created/modified
            };

            // Only add if not already in our files or contextDashboardsToInclude
            const alreadyIncluded =
              files.some((f) => f.id === dashboardFile.id) ||
              contextDashboardsToInclude.some((f) => f.id === dashboardFile.id);

            if (!alreadyIncluded) {
              contextDashboardsToInclude.push(dashboardFile);
            }
          }
        }
      }
    }
  }

  // Build final selection based on priority rules
  const selectedFiles: ExtractedFile[] = [];

  // 1. First priority: Dashboards from context that contain modified metrics
  if (contextDashboardsToInclude.length > 0) {
    console.info('[File Selection] Adding context dashboards:', {
      count: contextDashboardsToInclude.length,
      dashboards: contextDashboardsToInclude.map(d => ({ id: d.id, name: d.fileName })),
    });
    selectedFiles.push(...contextDashboardsToInclude);
  } else {
    console.info('[File Selection] No context dashboards to include');
  }

  // 2. Second priority: Dashboards from current session that contain modified metrics
  if (dashboardsToInclude.size > 0) {
    const affectedDashboards = dashboards.filter((d) => dashboardsToInclude.has(d.id));
    selectedFiles.push(...affectedDashboards);
  }

  // 3. Third priority: Other dashboards that were directly created/modified
  const otherDashboards = dashboards.filter((d) => !dashboardsToInclude.has(d.id));
  selectedFiles.push(...otherDashboards);

  // 4. Determine which metrics to include
  if (selectedFiles.length > 0) {
    // Don't include metrics that are already represented in selected dashboards
    const metricsInDashboards = new Set<string>();

    // Check metrics in session dashboards
    for (const dashboard of selectedFiles.filter((f) => f.ymlContent)) {
      if (dashboard.ymlContent) {
        const metricIds = extractMetricIdsFromDashboard(dashboard.ymlContent);
        for (const id of metricIds) {
          metricsInDashboards.add(id);
        }
      }
    }

    // Check metrics in context dashboards
    if (dashboardContext) {
      for (const dashboard of selectedFiles) {
        const contextDashboard = dashboardContext.find((d) => d.id === dashboard.id);
        if (contextDashboard) {
          for (const metricId of contextDashboard.metricIds) {
            metricsInDashboards.add(metricId);
          }
        }
      }
    }

    // Include standalone metrics (not in any returned dashboard)
    const standaloneMetrics = metrics.filter((m) => !metricsInDashboards.has(m.id));
    selectedFiles.push(...standaloneMetrics);
  } else {
    // No dashboards selected, just return metrics
    selectedFiles.push(...metrics);
  }

  console.info('[File Selection] Final selection:', {
    totalSelected: selectedFiles.length,
    selectedFiles: selectedFiles.map((f) => ({
      id: f.id,
      type: f.fileType,
      name: f.fileName,
      operation: f.operation,
    })),
  });

  return selectedFiles;
}

/**
 * Create file response messages for selected files
 */
export function createFileResponseMessages(files: ExtractedFile[]): ChatMessageResponseMessage[] {
  return files.map((file) => ({
    id: file.id, // Use the actual file ID instead of generating a new UUID
    type: 'file' as const,
    file_type: file.fileType,
    file_name: file.fileName,
    version_number: file.versionNumber || 1, // Use the actual version number from the file
    filter_version_id: null,
    metadata: [
      {
        status: 'completed' as const,
        message: `${file.fileType === 'dashboard' ? 'Dashboard' : 'Metric'} ${file.operation || 'created'} successfully`,
        timestamp: Date.now(),
      },
    ],
  }));
}
