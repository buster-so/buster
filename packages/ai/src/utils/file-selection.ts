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
    // Parse YAML content - assuming it's in JSON format for the TypeScript side
    const dashboardData = JSON.parse(ymlContent);

    // For now, skip Zod validation and manually extract metric IDs
    // This allows us to handle both UUID and non-UUID metric IDs during the transition
    const metricIds: string[] = [];

    if (dashboardData.rows && Array.isArray(dashboardData.rows)) {
      for (const row of dashboardData.rows) {
        if (row.items && Array.isArray(row.items)) {
          for (const item of row.items) {
            if (item.id && typeof item.id === 'string') {
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
export function selectFilesForResponse(files: ExtractedFile[]): ExtractedFile[] {
  // Separate dashboards and metrics
  const dashboards = files.filter((f) => f.fileType === 'dashboard');
  const metrics = files.filter((f) => f.fileType === 'metric');

  // Track which dashboards need to be included due to modified metrics
  const dashboardsToInclude = new Set<string>();

  // Check if any modified metrics belong to dashboards
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

  // Build final selection based on priority rules
  const selectedFiles: ExtractedFile[] = [];

  // 1. If there are dashboards that contain modified metrics, include them
  if (dashboardsToInclude.size > 0) {
    const affectedDashboards = dashboards.filter((d) => dashboardsToInclude.has(d.id));
    selectedFiles.push(...affectedDashboards);

    // Also include any other dashboards that were directly created/modified
    const otherDashboards = dashboards.filter((d) => !dashboardsToInclude.has(d.id));
    selectedFiles.push(...otherDashboards);

    // Don't include metrics that are already represented in dashboards
    const metricsInDashboards = new Set<string>();
    for (const dashboard of selectedFiles) {
      if (dashboard.ymlContent) {
        const metricIds = extractMetricIdsFromDashboard(dashboard.ymlContent);
        for (const id of metricIds) {
          metricsInDashboards.add(id);
        }
      }
    }

    // Include standalone metrics (not in any returned dashboard)
    const standaloneMetrics = metrics.filter((m) => !metricsInDashboards.has(m.id));
    selectedFiles.push(...standaloneMetrics);
  } else {
    // Standard priority: dashboards > metrics
    if (dashboards.length > 0) {
      selectedFiles.push(...dashboards);
    } else if (metrics.length > 0) {
      selectedFiles.push(...metrics);
    }
  }

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
