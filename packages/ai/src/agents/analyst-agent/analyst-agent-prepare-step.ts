import type { ModelMessage } from 'ai';
import { MODIFY_DASHBOARDS_TOOL_NAME } from '../../tools/visualization-tools/dashboards/modify-dashboards-tool/modify-dashboards-tool';
import { MODIFY_METRICS_TOOL_NAME } from '../../tools/visualization-tools/metrics/modify-metrics-tool/modify-metrics-tool';
import { MODIFY_REPORTS_TOOL_NAME } from '../../tools/visualization-tools/reports/modify-reports-tool/modify-reports-tool';

interface ModifyToolOutput {
  id: string;
  messageIndex: number;
  toolName: string;
}

const REPLACEMENT_MESSAGE =
  'This version of the report has been removed due to a more recent state being available.';

async function compressModifyReportsMessages(messages: ModelMessage[]): Promise<ModelMessage[]> {
  // Track modifications by asset ID
  const modificationsByAssetId = new Map<string, ModifyToolOutput[]>();

  // First pass: identify all modify tool calls and their outputs
  messages.forEach((message, index) => {
    if (message.role === 'tool' && Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          const toolName = content.toolName;

          // Check if this is a modify tool
          if (
            toolName === MODIFY_METRICS_TOOL_NAME ||
            toolName === MODIFY_REPORTS_TOOL_NAME ||
            toolName === MODIFY_DASHBOARDS_TOOL_NAME
          ) {
            // Parse the output to get the asset ID(s)
            try {
              const output = content.output;
              if (output && typeof output === 'object' && 'value' in output) {
                const parsedOutput =
                  typeof output.value === 'string' ? JSON.parse(output.value) : output.value;

                // Handle different output structures for each tool type
                if (toolName === MODIFY_METRICS_TOOL_NAME && parsedOutput.files) {
                  // modifyMetrics can modify multiple files
                  for (const file of parsedOutput.files) {
                    if (file.id) {
                      const assetId = `${toolName}-${file.id}`;
                      if (!modificationsByAssetId.has(assetId)) {
                        modificationsByAssetId.set(assetId, []);
                      }
                      const modifications = modificationsByAssetId.get(assetId);
                      if (modifications) {
                        modifications.push({
                          id: file.id,
                          messageIndex: index,
                          toolName,
                        });
                      }
                    }
                  }
                } else if (toolName === MODIFY_REPORTS_TOOL_NAME && parsedOutput.file?.id) {
                  // modifyReports modifies a single report
                  const assetId = `${toolName}-${parsedOutput.file.id}`;
                  if (!modificationsByAssetId.has(assetId)) {
                    modificationsByAssetId.set(assetId, []);
                  }
                  const modifications = modificationsByAssetId.get(assetId);
                  if (modifications) {
                    modifications.push({
                      id: parsedOutput.file.id,
                      messageIndex: index,
                      toolName,
                    });
                  }
                } else if (toolName === MODIFY_DASHBOARDS_TOOL_NAME && parsedOutput.files) {
                  // modifyDashboards can modify multiple files
                  for (const file of parsedOutput.files) {
                    if (file.id) {
                      const assetId = `${toolName}-${file.id}`;
                      if (!modificationsByAssetId.has(assetId)) {
                        modificationsByAssetId.set(assetId, []);
                      }
                      const dashModifications = modificationsByAssetId.get(assetId);
                      if (dashModifications) {
                        dashModifications.push({
                          id: file.id,
                          messageIndex: index,
                          toolName,
                        });
                      }
                    }
                  }
                }
              }
            } catch (error) {
              // If we can't parse the output, skip this message
              console.warn('Failed to parse tool output for compression:', error);
            }
          }
        }
      }
    }
  });

  // Identify which message indices should be compressed
  const indicesToCompress = new Set<number>();
  for (const modifications of modificationsByAssetId.values()) {
    if (modifications.length > 1) {
      // Keep the last modification, compress the rest
      for (let i = 0; i < modifications.length - 1; i++) {
        const mod = modifications[i];
        if (mod) {
          indicesToCompress.add(mod.messageIndex);
        }
      }
    }
  }

  // Second pass: create compressed messages
  return messages.map((message, index) => {
    if (!indicesToCompress.has(index)) {
      return message;
    }

    // This message should be compressed
    if (message.role === 'tool' && Array.isArray(message.content)) {
      const compressedContent = message.content.map((content) => {
        if (content.type === 'tool-result') {
          const toolName = content.toolName;

          if (
            toolName === MODIFY_METRICS_TOOL_NAME ||
            toolName === MODIFY_REPORTS_TOOL_NAME ||
            toolName === MODIFY_DASHBOARDS_TOOL_NAME
          ) {
            // Replace the output with the replacement message
            return {
              ...content,
              output: {
                type: 'text' as const,
                value: REPLACEMENT_MESSAGE,
              },
            };
          }
        }
        return content;
      });

      return {
        ...message,
        content: compressedContent,
      };
    }

    return message;
  });
}

export async function analystAgentPrepareStep({ messages }: { messages: ModelMessage[] }) {
  const compressedMessages = await compressModifyReportsMessages(messages);

  return {
    messages: [...compressedMessages],
  };
}
