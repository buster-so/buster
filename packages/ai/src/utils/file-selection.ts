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

  return files;
}

/**
 * Apply intelligent selection logic for files to return
 * Priority: dashboards > multiple metrics > single metric
 */
export function selectFilesForResponse(files: ExtractedFile[]): ExtractedFile[] {
  // Separate dashboards and metrics
  const dashboards = files.filter((f) => f.fileType === 'dashboard');
  const metrics = files.filter((f) => f.fileType === 'metric');

  // Apply priority logic
  if (dashboards.length > 0) {
    return dashboards; // Return all dashboards
  }
  if (metrics.length > 0) {
    return metrics; // Return all metrics
  }

  return []; // No files to return
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
    version_number: 1,
    filter_version_id: null,
    metadata: [
      {
        status: 'completed' as const,
        message: `${file.fileType === 'dashboard' ? 'Dashboard' : 'Metric'} created successfully`,
        timestamp: Date.now(),
      },
    ],
  }));
}