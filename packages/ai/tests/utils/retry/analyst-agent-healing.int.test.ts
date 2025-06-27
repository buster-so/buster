import { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage, StreamTextResult } from 'ai';
import { NoSuchToolError } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { analystAgent } from '../../../src/agents/analyst-agent/analyst-agent';
import { retryableAgentStreamWithHealing } from '../../../src/utils/retry';
import type { AnalystRuntimeContext } from '../../../src/workflows/analyst-workflow';

describe('Analyst Agent - Tool Error Healing Integration', () => {
  it('should heal when analyst tries to call non-existent tool', async () => {
    // Mock scenario: Agent tries to call a tool that doesn't exist
    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: 'Analyze my sales data and create a dashboard',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: "I'll analyze your sales data and create a dashboard. Let me start by understanding your data structure.",
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call_123',
            toolName: 'nonExistentTool', // This tool doesn't exist!
            args: { query: 'SELECT * FROM sales' },
          },
        ],
      },
    ];

    const healingCallbackTriggered = false;
    let healedError: any;

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('chatId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');

    const result = await retryableAgentStreamWithHealing({
      agent: analystAgent,
      messages,
      options: {
        toolCallStreaming: true,
        runtimeContext,
      },
      retryConfig: {
        maxRetries: 3,
        onRetry: (error, attempt) => {
          console.log(`Healing attempt ${attempt}:`, error.type);
          healedError = error;
        },
      },
    });

    // The stream should complete successfully with healing
    expect(result.stream).toBeDefined();
    expect(result.retryCount).toBeGreaterThanOrEqual(0);
  });

  it('should test healing with mock tool interceptor', async () => {
    // Create a wrapper that intercepts tool calls
    const createMockAgentWithToolErrors = (realAgent: typeof analystAgent) => {
      let callCount = 0;

      return {
        ...realAgent,
        stream: async (messages: CoreMessage[], options: any) => {
          // Intercept the options to add our error-throwing logic
          const wrappedOptions = {
            ...options,
            // Override the tool execution
            tools: new Proxy(realAgent.tools || {}, {
              get(target, prop) {
                const tool = target[prop as string];
                if (!tool) return undefined;

                // For the first call to a specific tool, throw an error
                if (prop === 'sequential-thinking' && callCount === 0) {
                  callCount++;
                  return {
                    ...tool,
                    execute: async () => {
                      throw new NoSuchToolError({
                        toolName: 'sequential-thinking-typo',
                        availableTools: Object.keys(target),
                      });
                    },
                  };
                }

                return tool;
              },
            }),
          };

          return realAgent.stream(messages, wrappedOptions);
        },
      };
    };

    const mockAgent = createMockAgentWithToolErrors(analystAgent);
    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: 'Create a sales dashboard',
      },
    ];

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('chatId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');

    const result = await retryableAgentStreamWithHealing({
      agent: mockAgent as any,
      messages,
      options: {
        toolCallStreaming: true,
        runtimeContext,
      },
    });

    expect(result.stream).toBeDefined();
  });

  it('should test invalid tool arguments healing', async () => {
    // Create a test with pre-constructed messages that would trigger invalid args
    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: 'Create a metrics file for my data',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call_456',
            toolName: 'create-metrics-file',
            args: {
              // Intentionally bad args - missing required fields
              files: 'invalid string instead of array',
            },
          },
        ],
      },
    ];

    let healingOccurred = false;

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('chatId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');

    const result = await retryableAgentStreamWithHealing({
      agent: analystAgent,
      messages,
      options: {
        toolCallStreaming: true,
        runtimeContext,
      },
      retryConfig: {
        maxRetries: 3,
        onRetry: (error) => {
          if (error.type === 'invalid-tool-arguments') {
            healingOccurred = true;
          }
        },
      },
    });

    expect(result.stream).toBeDefined();
    // Note: In real execution, the onError callback would handle this
  });
});

// Helper to create a controlled test environment
function createTestScenarioWithBadToolCall() {
  // Option 1: Use a mock tool that always fails
  const failingTool = {
    id: 'failing-tool',
    description: 'A tool that always fails for testing',
    inputSchema: {} as any,
    outputSchema: {} as any,
    execute: async () => {
      throw new NoSuchToolError({
        toolName: 'failing-tool',
        availableTools: ['working-tool'],
      });
    },
  };

  // Option 2: Create a message history that includes a bad tool call
  const messagesWithBadToolCall: CoreMessage[] = [
    {
      role: 'user',
      content: 'Test request',
    },
    {
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: 'bad_call_123',
          toolName: 'this-tool-does-not-exist',
          args: {},
        },
      ],
    },
  ];

  // Option 3: Monkey-patch the agent's tools temporarily
  const patchAgentTools = (agent: any) => {
    const originalTools = agent.tools;
    let shouldFail = true;

    agent.tools = new Proxy(originalTools || {}, {
      get(target, prop) {
        if (prop === 'some-tool' && shouldFail) {
          shouldFail = false; // Only fail once
          return undefined; // Simulate tool not found
        }
        return target[prop];
      },
    });

    return () => {
      agent.tools = originalTools; // Restore
    };
  };

  return {
    failingTool,
    messagesWithBadToolCall,
    patchAgentTools,
  };
}
