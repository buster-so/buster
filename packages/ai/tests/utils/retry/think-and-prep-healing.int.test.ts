import { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { NoSuchToolError } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { thinkAndPrepAgent } from '../../../src/agents/think-and-prep-agent/think-and-prep-agent';
import { retryableAgentStreamWithHealing } from '../../../src/utils/retry';
import type { AnalystRuntimeContext } from '../../../src/workflows/analyst-workflow';

describe('Think-and-Prep Agent - Tool Error Healing Integration', () => {
  it.skip('should heal when think-and-prep agent tries to call create-metrics-file - SKIPPED: Cannot force real agent to execute pre-crafted tool calls', async () => {
    // This simulates the real issue: think-and-prep agent trying to create files
    // when it should only be thinking and preparing
    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: 'Create a dashboard showing monthly sales trends',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: "I'll create a dashboard for your monthly sales trends. Let me start by creating the metrics file.",
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call_thinkprep_123',
            toolName: 'create-metrics-file', // THIS TOOL DOESN'T EXIST IN THINK-AND-PREP!
            args: {
              files: [
                {
                  file_name: 'sales_metrics.yml',
                  datasource: 'sales_db',
                  collections: [
                    {
                      name: 'monthly_sales',
                      sql: 'SELECT * FROM sales',
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ];

    let healingOccurred = false;
    let healedError: any;

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('chatId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');

    const result = await retryableAgentStreamWithHealing({
      agent: thinkAndPrepAgent,
      messages,
      options: {
        toolCallStreaming: true,
        runtimeContext,
      },
      retryConfig: {
        maxRetries: 3,
        onRetry: (error, attempt) => {
          console.log(`Think-and-Prep healing attempt ${attempt}:`, error.type);
          healingOccurred = true;
          healedError = error;

          // Verify the error message mentions available tools
          if (error.healingMessage.role === 'tool' && Array.isArray(error.healingMessage.content)) {
            const toolResult = error.healingMessage.content[0];
            if ('result' in toolResult && toolResult.result && 'error' in toolResult.result) {
              console.log('Error message:', toolResult.result.error);
              // Should list the actual available tools: sequentialThinking, executeSql, respondWithoutAnalysis, submitThoughts
              expect(toolResult.result.error).toContain('sequentialThinking');
              expect(toolResult.result.error).toContain('executeSql');
              expect(toolResult.result.error).not.toContain('create-metrics-file');
            }
          }
        },
      },
    });

    expect(result.stream).toBeDefined();
    expect(healingOccurred).toBe(true);
    expect(healedError?.type).toBe('no-such-tool');
  });

  it.skip('should heal when think-and-prep tries multiple visualization tools - SKIPPED: Cannot force real agent to execute pre-crafted tool calls', async () => {
    // Simulate the agent trying various visualization tools it doesn't have
    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: 'Analyze sales data and create visualizations',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call_1',
            toolName: 'create-dashboards-file', // Not available!
            args: { files: [] },
          },
        ],
      },
    ];

    const healingAttempts: any[] = [];

    const result = await retryableAgentStreamWithHealing({
      agent: thinkAndPrepAgent,
      messages,
      options: {
        toolCallStreaming: true,
        runtimeContext: (() => {
          const ctx = new RuntimeContext<AnalystRuntimeContext>();
          ctx.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
          ctx.set('chatId', crypto.randomUUID());
          ctx.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
          ctx.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
          ctx.set('dataSourceSyntax', 'postgres');
          return ctx;
        })(),
      },
      retryConfig: {
        maxRetries: 3,
        onRetry: (error, attempt) => {
          healingAttempts.push({
            attempt,
            errorType: error.type,
            toolName: error.originalError?.toolName || 'unknown',
          });
        },
      },
    });

    expect(result.stream).toBeDefined();
    expect(healingAttempts.length).toBeGreaterThan(0);
    expect(healingAttempts[0].errorType).toBe('no-such-tool');
    expect(healingAttempts[0].toolName).toBe('create-dashboards-file');
  });

  it('should complete successfully when using only available tools', async () => {
    // This should work without any healing needed
    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: 'Think about how to analyze sales data',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call_valid_1',
            toolName: 'sequentialThinking', // This tool exists!
            args: {
              thought: 'I need to understand the sales data structure first',
            },
          },
        ],
      },
    ];

    let healingOccurred = false;

    const result = await retryableAgentStreamWithHealing({
      agent: thinkAndPrepAgent,
      messages,
      options: {
        toolCallStreaming: true,
        runtimeContext: (() => {
          const ctx = new RuntimeContext<AnalystRuntimeContext>();
          ctx.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
          ctx.set('chatId', crypto.randomUUID());
          ctx.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
          ctx.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
          ctx.set('dataSourceSyntax', 'postgres');
          return ctx;
        })(),
      },
      retryConfig: {
        maxRetries: 3,
        onRetry: () => {
          healingOccurred = true;
        },
      },
    });

    expect(result.stream).toBeDefined();
    expect(healingOccurred).toBe(false); // No healing should occur
    expect(result.retryCount).toBe(0);
  });

  it.skip('should provide helpful error messages listing available tools - SKIPPED: Cannot force real agent to execute pre-crafted tool calls', async () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call_test',
            toolName: 'modify-metrics-file',
            args: {},
          },
        ],
      },
    ];

    let capturedErrorMessage = '';

    const result = await retryableAgentStreamWithHealing({
      agent: thinkAndPrepAgent,
      messages,
      options: {
        toolCallStreaming: true,
        runtimeContext: (() => {
          const ctx = new RuntimeContext<AnalystRuntimeContext>();
          ctx.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
          ctx.set('chatId', crypto.randomUUID());
          ctx.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
          ctx.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
          ctx.set('dataSourceSyntax', 'postgres');
          return ctx;
        })(),
      },
      retryConfig: {
        maxRetries: 1,
        onRetry: (error) => {
          if (error.healingMessage.role === 'tool' && Array.isArray(error.healingMessage.content)) {
            const toolResult = error.healingMessage.content[0];
            if ('result' in toolResult && toolResult.result && 'error' in toolResult.result) {
              capturedErrorMessage = toolResult.result.error as string;
            }
          }
        },
      },
    });

    expect(result.stream).toBeDefined();

    // Verify the error message lists the correct available tools
    expect(capturedErrorMessage).toContain('Tool "modify-metrics-file" is not available');
    expect(capturedErrorMessage).toContain('Available tools:');
    expect(capturedErrorMessage).toContain('sequentialThinking');
    expect(capturedErrorMessage).toContain('executeSql');
    expect(capturedErrorMessage).toContain('respondWithoutAnalysis');
    expect(capturedErrorMessage).toContain('submitThoughts');

    // Verify it does NOT list visualization tools
    expect(capturedErrorMessage).not.toContain('create-metrics-file');
    expect(capturedErrorMessage).not.toContain('create-dashboards-file');
  });
});

// Real-world scenario test
describe('Think-and-Prep Real Scenario', () => {
  it('should handle agent confusion about its role', async () => {
    // This tests a common scenario where the agent gets confused about what it can do
    const messages: CoreMessage[] = [
      {
        role: 'user',
        content:
          'I need you to create a sales dashboard with revenue trends, top products, and customer segments',
      },
      // The agent might naturally try to create files here
    ];

    const healingMessages: string[] = [];
    let finalToolUsed: string | undefined;

    const result = await retryableAgentStreamWithHealing({
      agent: thinkAndPrepAgent,
      messages,
      options: {
        toolCallStreaming: true,
        runtimeContext: (() => {
          const ctx = new RuntimeContext<AnalystRuntimeContext>();
          ctx.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
          ctx.set('chatId', crypto.randomUUID());
          ctx.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
          ctx.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
          ctx.set('dataSourceSyntax', 'postgres');
          return ctx;
        })(),
        temperature: 0.5, // Add some variability
      },
      retryConfig: {
        maxRetries: 5, // Allow more retries for learning
        onRetry: (error, attempt) => {
          if (error.healingMessage.role === 'tool' && Array.isArray(error.healingMessage.content)) {
            const toolResult = error.healingMessage.content[0];
            if ('result' in toolResult && toolResult.result && 'error' in toolResult.result) {
              healingMessages.push(`Attempt ${attempt}: ${toolResult.result.error}`);
            }
          }
        },
      },
    });

    // Process the stream to see what tool it eventually uses
    for await (const chunk of result.stream.fullStream) {
      if (chunk.type === 'tool-call') {
        finalToolUsed = chunk.toolName;
        console.log(`Agent eventually used: ${chunk.toolName}`);
      }
    }

    expect(result.stream).toBeDefined();

    // The agent should eventually use one of its available tools
    if (finalToolUsed) {
      expect([
        'sequentialThinking',
        'executeSql',
        'respondWithoutAnalysis',
        'submitThoughts',
      ]).toContain(finalToolUsed);
    }

    // Log healing attempts for debugging
    if (healingMessages.length > 0) {
      console.log('Healing messages:', healingMessages);
    }
  });
});
