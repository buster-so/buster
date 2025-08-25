import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import {
  CREATE_DASHBOARDS_TOOL_NAME,
  type CreateDashboardsOutput,
} from '../../../visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import {
  MODIFY_DASHBOARDS_TOOL_NAME,
  type ModifyDashboardsOutput,
} from '../../../visualization-tools/dashboards/modify-dashboards-tool/modify-dashboards-tool';
import {
  CREATE_METRICS_TOOL_NAME,
  type CreateMetricsOutput,
} from '../../../visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import {
  MODIFY_METRICS_TOOL_NAME,
  type ModifyMetricsOutput,
} from '../../../visualization-tools/metrics/modify-metrics-tool/modify-metrics-tool';
import {
  CREATE_REPORTS_TOOL_NAME,
  type CreateReportsOutput,
} from '../../../visualization-tools/reports/create-reports-tool/create-reports-tool';
import {
  MODIFY_REPORTS_TOOL_NAME,
  type ModifyReportsOutput,
} from '../../../visualization-tools/reports/modify-reports-tool/modify-reports-tool';

// Union type for all tool outputs
type ToolOutput =
  | CreateMetricsOutput
  | ModifyMetricsOutput
  | CreateDashboardsOutput
  | ModifyDashboardsOutput
  | CreateReportsOutput
  | ModifyReportsOutput;

// File info from tool outputs
interface ToolFileInfo {
  id: string;
  name?: string;
  file_name?: string;
  file_type?: string;
  status?: string;
  version_number?: number;
  metric_ids?: string[];
  metricIds?: string[];
}

// File tracking type
interface ExtractedFile {
  id: string;
  fileType: 'metric' | 'dashboard' | 'report';
  fileName: string;
  status: 'completed' | 'failed' | 'loading';
  operation?: 'created' | 'modified' | undefined;
  versionNumber?: number | undefined;
  metricIds?: string[] | undefined; // IDs of metrics that belong to this dashboard
  content?: string | undefined; // Content of reports for checking absorbed files
}

// Report info tracking
interface ReportInfo {
  id: string;
  content: string;
  versionNumber: number;
  operation: 'created' | 'modified';
}

/**
 * Extract files from tool call responses in the conversation messages
 * Focuses on tool result messages that contain file information
 */
export function extractFilesFromToolCalls(messages: ModelMessage[]): ExtractedFile[] {
  const files: ExtractedFile[] = [];
  let lastReportInfo: ReportInfo | undefined;

  console.info('[done-tool-file-selection] Starting file extraction from messages', {
    messageCount: messages.length,
  });

  // First pass: extract create report content from assistant messages
  const createReportContents: Map<string, string> = new Map();

  for (const message of messages) {
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      for (const content of message.content) {
        if (
          content &&
          typeof content === 'object' &&
          'type' in content &&
          content.type === 'tool-call' &&
          'toolName' in content &&
          content.toolName === CREATE_REPORTS_TOOL_NAME
        ) {
          console.info('[done-tool-file-selection] Found create reports tool call');

          // Extract report content from input and store with toolCallId as key
          const contentObj = content as { toolCallId?: string; input?: unknown };
          const toolCallId = contentObj.toolCallId;
          const input = contentObj.input as {
            files?: Array<{ yml_content?: string; content?: string }>;
          };
          if (toolCallId && input && input.files && Array.isArray(input.files)) {
            for (const file of input.files) {
              // Check for both yml_content and content fields
              const reportContent = file.yml_content || file.content;
              if (reportContent) {
                createReportContents.set(toolCallId, reportContent);
                console.info('[done-tool-file-selection] Stored report content for toolCallId', {
                  toolCallId,
                  contentLength: reportContent.length,
                });
              }
            }
          }
        }
      }
    }
  }

  // Second pass: process tool results and match create report content
  for (const message of messages) {
    console.info('[done-tool-file-selection] Processing message', {
      role: message.role,
      contentType: Array.isArray(message.content) ? 'array' : typeof message.content,
    });

    // Check tool messages for results
    if (message.role === 'tool') {
      const toolContent = message.content;

      if (Array.isArray(toolContent)) {
        // Handle array of tool results
        for (const content of toolContent) {
          console.info('[done-tool-file-selection] Processing tool content item', {
            hasType: 'type' in (content || {}),
            type: (content as unknown as Record<string, unknown>)?.type,
            hasToolName: 'toolName' in (content || {}),
            toolName: (content as unknown as Record<string, unknown>)?.toolName,
            hasOutput: 'output' in (content || {}),
            contentKeys: content ? Object.keys(content) : [],
          });

          if (content && typeof content === 'object') {
            // Check if this is a tool-result type
            if ('type' in content && content.type === 'tool-result') {
              // Extract the tool name and output
              const toolName = (content as unknown as Record<string, unknown>).toolName;
              const output = (content as unknown as Record<string, unknown>).output;

              console.info('[done-tool-file-selection] Found tool-result', {
                toolName,
                hasOutput: !!output,
                outputType: (output as Record<string, unknown>)?.type,
              });

              const outputObj = output as Record<string, unknown>;
              const contentWithCallId = content as { toolCallId?: string };
              const toolCallId = contentWithCallId.toolCallId;

              if (outputObj && outputObj.type === 'json' && outputObj.value) {
                try {
                  // Check if output.value is already an object or needs parsing
                  const parsedOutput =
                    typeof outputObj.value === 'string'
                      ? JSON.parse(outputObj.value)
                      : outputObj.value;

                  // Process the output and check for report updates
                  const reportUpdate = processToolOutput(
                    toolName as string,
                    parsedOutput,
                    files,
                    toolCallId,
                    createReportContents
                  );

                  // Update last report info if we found a report
                  if (reportUpdate) {
                    lastReportInfo = reportUpdate;
                  }
                } catch (error) {
                  console.warn('[done-tool-file-selection] Failed to parse JSON output', {
                    toolName,
                    error,
                    valueType: typeof outputObj.value,
                    value: outputObj.value,
                  });
                }
              }
            }
            // Also check if the content itself has files directly (backward compatibility)
            else if ('files' in content || 'file' in content) {
              console.info('[done-tool-file-selection] Found direct file content in tool result');
              processDirectFileContent(content, files);
            }
          }
        }
      }
    }
  }

  // Count reports with metrics
  const reportsWithMetrics = files.filter((f) => {
    if (f.fileType !== 'report') return false;
    // Check if report has content and contains metrics
    return f.content?.match(/<metric\s+metricId\s*=\s*["'][a-f0-9-]+["']\s*\/>/i);
  });

  console.info('[done-tool-file-selection] Extracted files before deduplication', {
    totalFiles: files.length,
    metrics: files.filter((f) => f.fileType === 'metric').length,
    dashboards: files.filter((f) => f.fileType === 'dashboard').length,
    reports: files.filter((f) => f.fileType === 'report').length,
    reportsWithMetrics: reportsWithMetrics.length,
    lastReportContent: lastReportInfo ? `${lastReportInfo.content.substring(0, 100)}...` : 'none',
  });

  // Deduplicate files by ID, keeping highest version
  const deduplicatedFiles = deduplicateFilesByVersion(files);

  // Filter out metrics that belong to dashboards
  let filteredFiles = filterOutDashboardMetrics(deduplicatedFiles);

  // Filter out metrics and dashboards that are referenced in reports
  filteredFiles = filterOutReportContainedFiles(filteredFiles, lastReportInfo);

  // Filter out reports that don't have metrics (they won't be in responseMessages anyway)
  // Keep reports that have metrics since they'll be in the responseMessages
  filteredFiles = filteredFiles.filter((file) => {
    if (file.fileType !== 'report') {
      return true; // Keep all non-report files that passed previous filters
    }

    // For reports, only keep them if they contain metrics
    // Reports with metrics will be in responseMessages already, so we filter them out here
    // to avoid duplication
    return false;
  });

  console.info('[done-tool-file-selection] Final selected files', {
    totalSelected: filteredFiles.length,
    selectedIds: filteredFiles.map((f) => ({ id: f.id, type: f.fileType, name: f.fileName })),
  });

  return filteredFiles;
}

/**
 * Process tool output based on tool name
 */
function processToolOutput(
  toolName: string,
  output: unknown,
  files: ExtractedFile[],
  toolCallId?: string,
  createReportContents?: Map<string, string>
): ReportInfo | undefined {
  const toolOutput = output as ToolOutput;
  let reportInfo: ReportInfo | undefined;

  console.info('[done-tool-file-selection] Processing tool output', {
    toolName,
    toolCallId,
    hasFiles: toolOutput && 'files' in toolOutput,
    hasFile: toolOutput && 'file' in toolOutput,
    outputKeys: toolOutput ? Object.keys(toolOutput) : [],
  });

  // Handle different tool types based on their name constants
  switch (toolName) {
    case CREATE_METRICS_TOOL_NAME:
    case MODIFY_METRICS_TOOL_NAME:
      processMetricsOutput(
        output,
        files,
        toolName === MODIFY_METRICS_TOOL_NAME ? 'modified' : 'created'
      );
      break;

    case CREATE_DASHBOARDS_TOOL_NAME:
    case MODIFY_DASHBOARDS_TOOL_NAME:
      processDashboardsOutput(
        output,
        files,
        toolName === MODIFY_DASHBOARDS_TOOL_NAME ? 'modified' : 'created'
      );
      break;

    case CREATE_REPORTS_TOOL_NAME:
      reportInfo = processCreateReportsOutput(output, files, toolCallId, createReportContents);
      break;

    case MODIFY_REPORTS_TOOL_NAME:
      reportInfo = processModifyReportsOutput(output, files);
      break;

    default:
      console.info('[done-tool-file-selection] Unknown tool name, skipping', {
        toolName,
      });
  }

  return reportInfo;
}

/**
 * Process metrics output
 */
function processMetricsOutput(
  output: unknown,
  files: ExtractedFile[],
  operation: 'created' | 'modified'
): void {
  const metricsOutput = output as CreateMetricsOutput | ModifyMetricsOutput;
  if (metricsOutput.files && Array.isArray(metricsOutput.files)) {
    console.info('[done-tool-file-selection] Processing metrics files', {
      count: metricsOutput.files.length,
      operation,
    });

    for (const file of metricsOutput.files) {
      // Handle both possible structures - files have 'name' property
      const fileName = file.name;

      console.info('[done-tool-file-selection] Processing metric file', {
        id: file.id,
        fileName,
        fileType: 'metric',
        hasFileName: !!fileName,
        fileKeys: Object.keys(file),
      });

      if (file.id && fileName) {
        files.push({
          id: file.id,
          fileType: 'metric',
          fileName: fileName,
          status: 'completed',
          operation,
          versionNumber: file.version_number || 1,
        });
      }
    }
  }
}

/**
 * Process dashboards output
 */
function processDashboardsOutput(
  output: unknown,
  files: ExtractedFile[],
  operation: 'created' | 'modified'
): void {
  const dashboardOutput = output as CreateDashboardsOutput | ModifyDashboardsOutput;
  if (dashboardOutput.files && Array.isArray(dashboardOutput.files)) {
    console.info('[done-tool-file-selection] Processing dashboard files', {
      count: dashboardOutput.files.length,
      operation,
    });

    for (const file of dashboardOutput.files) {
      const fileName = file.name;

      // Extract metric IDs if they exist in the dashboard (added by our modification)
      const metricIds = (file as ToolFileInfo).metric_ids || [];

      if (file.id && fileName) {
        files.push({
          id: file.id,
          fileType: 'dashboard',
          fileName: fileName,
          status: 'completed',
          operation,
          versionNumber: file.version_number || 1,
          metricIds: Array.isArray(metricIds) && metricIds.length > 0 ? metricIds : undefined,
        });
      }
    }
  }
}

/**
 * Process create reports output (content was in the input, match by toolCallId)
 */
function processCreateReportsOutput(
  output: unknown,
  files: ExtractedFile[],
  toolCallId?: string,
  createReportContents?: Map<string, string>
): ReportInfo | undefined {
  const reportsOutput = output as CreateReportsOutput;
  let reportInfo: ReportInfo | undefined;

  if ('files' in reportsOutput && reportsOutput.files && Array.isArray(reportsOutput.files)) {
    console.info('[done-tool-file-selection] Processing create report files array', {
      count: reportsOutput.files.length,
      toolCallId,
      hasContent: toolCallId && createReportContents ? createReportContents.has(toolCallId) : false,
    });

    for (const file of reportsOutput.files) {
      const fileName = file.name;

      if (file.id && fileName) {
        // Get the content from the create report input using toolCallId
        const content =
          toolCallId && createReportContents ? createReportContents.get(toolCallId) : undefined;

        files.push({
          id: file.id,
          fileType: 'report',
          fileName: fileName,
          status: 'completed',
          operation: 'created',
          versionNumber: file.version_number || 1,
          content: content, // Store the content from the input
        });

        // Track this as the last report if we have content
        if (content) {
          reportInfo = {
            id: file.id,
            content: content,
            versionNumber: file.version_number || 1,
            operation: 'created',
          };
        }
      }
    }
  }

  return reportInfo;
}

/**
 * Process modify reports output (content is in the output)
 */
function processModifyReportsOutput(
  output: unknown,
  files: ExtractedFile[]
): ReportInfo | undefined {
  const reportsOutput = output as ModifyReportsOutput;
  let reportInfo: ReportInfo | undefined;

  if ('file' in reportsOutput && reportsOutput.file && typeof reportsOutput.file === 'object') {
    const file = reportsOutput.file;
    const fileName = file.name;

    console.info('[done-tool-file-selection] Processing modify report file', {
      id: file.id,
      fileName,
      hasContent: !!file.content,
      contentLength: file.content?.length || 0,
    });

    if (file.id && fileName) {
      files.push({
        id: file.id,
        fileType: 'report',
        fileName: fileName,
        status: 'completed',
        operation: 'modified',
        versionNumber: file.version_number || 1,
        content: file.content, // Content is in the output for modify
      });

      // Track this as the last report
      if (file.content) {
        reportInfo = {
          id: file.id,
          content: file.content,
          versionNumber: file.version_number || 1,
          operation: 'modified',
        };
      }
    }
  }

  return reportInfo;
}

/**
 * Process direct file content (backward compatibility)
 */
function processDirectFileContent(content: unknown, files: ExtractedFile[]): void {
  const contentObj = content as { files?: ToolFileInfo[] };
  if (contentObj.files && Array.isArray(contentObj.files)) {
    for (const file of contentObj.files) {
      const fileName = file.file_name || file.name || '';
      const fileType = file.file_type || 'metric';

      if (file.id && fileName) {
        files.push({
          id: file.id,
          fileType: fileType as 'metric' | 'dashboard' | 'report',
          fileName: fileName,
          status: 'completed',
          operation: 'created',
          versionNumber: file.version_number || 1,
        });
      }
    }
  }
}

/**
 * Deduplicate files by ID, keeping the highest version number
 */
function deduplicateFilesByVersion(files: ExtractedFile[]): ExtractedFile[] {
  const deduplicated = new Map<string, ExtractedFile>();

  for (const file of files) {
    const existingFile = deduplicated.get(file.id);
    const fileVersion = file.versionNumber || 1;
    const existingVersion = existingFile?.versionNumber || 1;

    if (!existingFile || fileVersion > existingVersion) {
      deduplicated.set(file.id, file);
    }
  }

  return Array.from(deduplicated.values());
}

/**
 * Filter out metrics that belong to dashboards
 */
function filterOutDashboardMetrics(files: ExtractedFile[]): ExtractedFile[] {
  // Collect all metric IDs that belong to dashboards
  const metricsInDashboards = new Set<string>();

  for (const file of files) {
    if (file.fileType === 'dashboard' && file.metricIds) {
      for (const metricId of file.metricIds) {
        metricsInDashboards.add(metricId);
      }
    }
  }

  console.info('[done-tool-file-selection] Metrics belonging to dashboards', {
    metricCount: metricsInDashboards.size,
    metricIds: Array.from(metricsInDashboards),
  });

  // Filter out metrics that belong to dashboards
  const filtered = files.filter((file) => {
    // Keep all non-metric files
    if (file.fileType !== 'metric') {
      return true;
    }

    // Only keep metrics that don't belong to any dashboard
    const shouldExclude = metricsInDashboards.has(file.id);

    if (shouldExclude) {
      console.info('[done-tool-file-selection] Excluding metric that belongs to dashboard', {
        metricId: file.id,
        metricName: file.fileName,
      });
    }

    return !shouldExclude;
  });

  return filtered;
}

/**
 * Filter out metrics and dashboards that are referenced in reports
 * Any metric that appears in a report should not be selected
 */
function filterOutReportContainedFiles(
  files: ExtractedFile[],
  lastReportInfo?: ReportInfo
): ExtractedFile[] {
  if (!lastReportInfo || !lastReportInfo.content) {
    // No report content to check against
    console.info('[done-tool-file-selection] No report content to filter against');
    return files;
  }

  const reportContent = lastReportInfo.content;

  // Extract metric IDs from the last report content
  const metricsInReports = new Set<string>();
  const dashboardsInReports = new Set<string>();

  // Extract metric IDs from report content using regex pattern
  // Match any alphanumeric ID with hyphens (UUIDs, simple IDs like "metric-1", etc.)
  const metricIdPattern = /metricId[="']+([a-zA-Z0-9-]+)["']/gi;
  const matches = reportContent.matchAll(metricIdPattern);

  for (const match of matches) {
    if (match[1]) {
      metricsInReports.add(match[1]);
    }
  }

  // Also check for dashboard IDs in reports
  const dashboardIdPattern = /dashboardId[="']+([a-zA-Z0-9-]+)["']/gi;
  const dashboardMatches = reportContent.matchAll(dashboardIdPattern);

  for (const match of dashboardMatches) {
    if (match[1]) {
      dashboardsInReports.add(match[1]);
    }
  }

  console.info('[done-tool-file-selection] Checking for files absorbed by last report', {
    reportId: lastReportInfo.id,
    reportOperation: lastReportInfo.operation,
    contentLength: reportContent.length,
    metricsInReports: metricsInReports.size,
    dashboardsInReports: dashboardsInReports.size,
    metricIds: Array.from(metricsInReports),
    dashboardIds: Array.from(dashboardsInReports),
  });

  if (metricsInReports.size === 0 && dashboardsInReports.size === 0) {
    // No metrics or dashboards referenced in reports
    return files;
  }

  // Filter out metrics and dashboards that appear in report content
  const filtered = files.filter((file) => {
    // Check if this metric is referenced in a report
    if (file.fileType === 'metric' && metricsInReports.has(file.id)) {
      console.info('[done-tool-file-selection] Excluding metric referenced in report', {
        metricId: file.id,
        metricName: file.fileName,
      });
      return false;
    }

    // Check if this dashboard is referenced in a report
    if (file.fileType === 'dashboard' && dashboardsInReports.has(file.id)) {
      console.info('[done-tool-file-selection] Excluding dashboard referenced in report', {
        dashboardId: file.id,
        dashboardName: file.fileName,
      });
      return false;
    }

    return true;
  });

  return filtered;
}

/**
 * Create file response messages for selected files
 */
export function createFileResponseMessages(files: ExtractedFile[]): ChatMessageResponseMessage[] {
  return files.map((file) => {
    // Determine the display name for the file type
    const fileTypeDisplay =
      file.fileType === 'dashboard'
        ? 'Dashboard'
        : file.fileType === 'metric'
          ? 'Metric'
          : file.fileType === 'report'
            ? 'Report'
            : file.fileType;

    return {
      id: file.id,
      type: 'file' as const,
      file_type: file.fileType as 'metric' | 'dashboard' | 'report',
      file_name: file.fileName,
      version_number: file.versionNumber || 1,
      filter_version_id: null,
      metadata: [
        {
          status: 'completed' as const,
          message: `${fileTypeDisplay} ${file.operation || 'created'} successfully`,
          timestamp: Date.now(),
        },
      ],
    };
  });
}
