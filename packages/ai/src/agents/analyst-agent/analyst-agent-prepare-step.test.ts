import type { ModelMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { analystAgentPrepareStep } from './analyst-agent-prepare-step';

describe('analystAgentPrepareStep', () => {
  describe('message compression', () => {
    it('should not modify messages when there are no duplicate modifications', async () => {
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: 'Create a report',
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-1',
              toolName: 'modifyReports',
              output: {
                type: 'text',
                value: JSON.stringify({
                  success: true,
                  file: { id: 'report-1', name: 'Report 1', content: 'Content 1' },
                }),
              },
            },
          ],
        },
      ];

      const result = await analystAgentPrepareStep({ messages });
      expect(result.messages).toEqual(messages);
    });

    it('should compress older modifyReports outputs when same report is modified multiple times', async () => {
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: 'Create and modify a report',
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-1',
              toolName: 'modifyReports',
              output: {
                type: 'text',
                value: JSON.stringify({
                  success: true,
                  file: { id: 'report-1', name: 'Report 1', content: 'Initial content' },
                }),
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-2',
              toolName: 'modifyReports',
              output: {
                type: 'text',
                value: JSON.stringify({
                  success: true,
                  file: { id: 'report-1', name: 'Report 1', content: 'Updated content' },
                }),
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-3',
              toolName: 'modifyReports',
              output: {
                type: 'text',
                value: JSON.stringify({
                  success: true,
                  file: { id: 'report-1', name: 'Report 1', content: 'Final content' },
                }),
              },
            },
          ],
        },
      ];

      const result = await analystAgentPrepareStep({ messages });

      // First two modifications should be compressed
      const message1Content = result.messages[1];
      if (
        message1Content &&
        message1Content.role === 'tool' &&
        Array.isArray(message1Content.content)
      ) {
        const toolResult = message1Content.content[0];
        if (toolResult && 'output' in toolResult) {
          expect(toolResult.output.value).toBe(
            'This version of the report has been removed due to a more recent state being available.'
          );
        }
      }

      const message2Content = result.messages[2];
      if (
        message2Content &&
        message2Content.role === 'tool' &&
        Array.isArray(message2Content.content)
      ) {
        const toolResult = message2Content.content[0];
        if (toolResult && 'output' in toolResult) {
          expect(toolResult.output.value).toBe(
            'This version of the report has been removed due to a more recent state being available.'
          );
        }
      }

      // Last modification should remain intact
      const message3Content = result.messages[3];
      if (
        message3Content &&
        message3Content.role === 'tool' &&
        Array.isArray(message3Content.content)
      ) {
        const toolResult = message3Content.content[0];
        if (toolResult && 'output' in toolResult) {
          expect(toolResult.output.value).toContain('Final content');
        }
      }
    });

    it('should compress older modifyMetrics outputs when same metrics are modified multiple times', async () => {
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: 'Create and modify metrics',
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-1',
              toolName: 'modifyMetrics',
              output: {
                type: 'text',
                value: JSON.stringify({
                  message: 'Success',
                  files: [
                    { id: 'metric-1', name: 'Metric 1', version_number: 1 },
                    { id: 'metric-2', name: 'Metric 2', version_number: 1 },
                  ],
                }),
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-2',
              toolName: 'modifyMetrics',
              output: {
                type: 'text',
                value: JSON.stringify({
                  message: 'Updated',
                  files: [{ id: 'metric-1', name: 'Metric 1', version_number: 2 }],
                }),
              },
            },
          ],
        },
      ];

      const result = await analystAgentPrepareStep({ messages });

      // First modification should be compressed because metric-1 appears in both
      const message1Content = result.messages[1];
      if (
        message1Content &&
        message1Content.role === 'tool' &&
        Array.isArray(message1Content.content)
      ) {
        const toolResult = message1Content.content[0];
        if (toolResult && 'output' in toolResult) {
          expect(toolResult.output.value).toBe(
            'This version of the report has been removed due to a more recent state being available.'
          );
        }
      }

      // Second modification should remain intact
      const message2Content = result.messages[2];
      if (
        message2Content &&
        message2Content.role === 'tool' &&
        Array.isArray(message2Content.content)
      ) {
        const toolResult = message2Content.content[0];
        if (toolResult && 'output' in toolResult) {
          expect(toolResult.output.value).toContain('version_number');
        }
      }
    });

    it('should handle modifyDashboards with multiple files', async () => {
      const messages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-1',
              toolName: 'modifyDashboards',
              output: {
                type: 'text',
                value: JSON.stringify({
                  message: 'Success',
                  files: [
                    { id: 'dash-1', name: 'Dashboard 1' },
                    { id: 'dash-2', name: 'Dashboard 2' },
                  ],
                }),
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-2',
              toolName: 'modifyDashboards',
              output: {
                type: 'text',
                value: JSON.stringify({
                  message: 'Updated',
                  files: [{ id: 'dash-1', name: 'Dashboard 1 Updated' }],
                }),
              },
            },
          ],
        },
      ];

      const result = await analystAgentPrepareStep({ messages });

      // First message should be compressed for dash-1 but not dash-2
      const message0Content = result.messages[0];
      if (
        message0Content &&
        message0Content.role === 'tool' &&
        Array.isArray(message0Content.content)
      ) {
        const toolResult = message0Content.content[0];
        if (toolResult && 'output' in toolResult) {
          expect(toolResult.output.value).toBe(
            'This version of the report has been removed due to a more recent state being available.'
          );
        }
      }

      // Second message should remain intact
      const message1Content = result.messages[1];
      if (
        message1Content &&
        message1Content.role === 'tool' &&
        Array.isArray(message1Content.content)
      ) {
        const toolResult = message1Content.content[0];
        if (toolResult && 'output' in toolResult) {
          expect(toolResult.output.value).toContain('Dashboard 1 Updated');
        }
      }
    });

    it('should handle different assets independently', async () => {
      const messages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-1',
              toolName: 'modifyReports',
              output: {
                type: 'text',
                value: JSON.stringify({
                  success: true,
                  file: { id: 'report-1', name: 'Report 1', content: 'Content 1' },
                }),
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-2',
              toolName: 'modifyReports',
              output: {
                type: 'text',
                value: JSON.stringify({
                  success: true,
                  file: { id: 'report-2', name: 'Report 2', content: 'Content 2' },
                }),
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-3',
              toolName: 'modifyReports',
              output: {
                type: 'text',
                value: JSON.stringify({
                  success: true,
                  file: { id: 'report-1', name: 'Report 1', content: 'Updated Content 1' },
                }),
              },
            },
          ],
        },
      ];

      const result = await analystAgentPrepareStep({ messages });

      // First message should be compressed (report-1 is modified again)
      const message0Content = result.messages[0];
      if (
        message0Content &&
        message0Content.role === 'tool' &&
        Array.isArray(message0Content.content)
      ) {
        const toolResult = message0Content.content[0];
        if (toolResult && 'output' in toolResult) {
          expect(toolResult.output.value).toBe(
            'This version of the report has been removed due to a more recent state being available.'
          );
        }
      }

      // Second message should remain intact (report-2 is only modified once)
      const message1Content = result.messages[1];
      if (
        message1Content &&
        message1Content.role === 'tool' &&
        Array.isArray(message1Content.content)
      ) {
        const toolResult = message1Content.content[0];
        if (toolResult && 'output' in toolResult) {
          expect(toolResult.output.value).toContain('Report 2');
        }
      }

      // Third message should remain intact (latest version of report-1)
      const message2Content = result.messages[2];
      if (
        message2Content &&
        message2Content.role === 'tool' &&
        Array.isArray(message2Content.content)
      ) {
        const toolResult = message2Content.content[0];
        if (toolResult && 'output' in toolResult) {
          expect(toolResult.output.value).toContain('Updated Content 1');
        }
      }
    });

    it('should handle messages with non-modify tools', async () => {
      const messages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-1',
              toolName: 'executeSql',
              output: {
                type: 'text',
                value: 'SQL Result',
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-2',
              toolName: 'modifyReports',
              output: {
                type: 'text',
                value: JSON.stringify({
                  success: true,
                  file: { id: 'report-1', name: 'Report 1', content: 'Content' },
                }),
              },
            },
          ],
        },
      ];

      const result = await analystAgentPrepareStep({ messages });

      // executeSql tool should not be affected
      const message0Content = result.messages[0];
      if (
        message0Content &&
        message0Content.role === 'tool' &&
        Array.isArray(message0Content.content)
      ) {
        const toolResult = message0Content.content[0];
        if (toolResult && 'output' in toolResult) {
          expect(toolResult.output.value).toBe('SQL Result');
        }
      }

      // modifyReports should remain intact (only one modification)
      const message1Content = result.messages[1];
      if (
        message1Content &&
        message1Content.role === 'tool' &&
        Array.isArray(message1Content.content)
      ) {
        const toolResult = message1Content.content[0];
        if (toolResult && 'output' in toolResult) {
          expect(toolResult.output.value).toContain('Report 1');
        }
      }
    });

    it('should handle malformed output gracefully', async () => {
      const messages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-1',
              toolName: 'modifyReports',
              output: {
                type: 'text',
                value: 'Invalid JSON',
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-2',
              toolName: 'modifyReports',
              output: {
                type: 'text',
                value: JSON.stringify({
                  success: true,
                  file: { id: 'report-1', name: 'Report 1', content: 'Content' },
                }),
              },
            },
          ],
        },
      ];

      const result = await analystAgentPrepareStep({ messages });

      // Both messages should remain unchanged since we can't parse the first one
      expect(result.messages).toEqual(messages);
    });

    it('should handle non-text output types', async () => {
      const messages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call-1',
              toolName: 'modifyReports',
              output: {
                type: 'text',
                value: 'base64data',
              },
            },
          ],
        },
      ];

      const result = await analystAgentPrepareStep({ messages });

      // Message should remain unchanged
      expect(result.messages).toEqual(messages);
    });
  });
});
