import type { CoreMessage, TextStreamPart } from 'ai';
import { NoSuchToolError } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { retryableAgentStreamWithHealing } from '../../../src/utils/retry';
import type { MastraAgent } from '../../../src/utils/retry/types';

/**
 * This test simulates a real streaming scenario where:
 * 1. Agent starts streaming
 * 2. Agent calls a non-existent tool
 * 3. Error occurs during tool execution
 * 4. onError callback heals the error
 * 5. Agent continues with the healing response
 */
describe('Healing During Streaming - Real Scenario Simulation', () => {
  it('SIMULATION: Agent recovers from tool error mid-stream', async () => {
    const streamEvents: string[] = [];
    let onErrorCallback: ((error: unknown) => unknown) | undefined;

    // Create a mock agent that simulates real streaming behavior
    const mockAgent: MastraAgent = {
      name: 'streaming-test-agent',
      tools: {
        'valid-tool-1': {} as any,
        'valid-tool-2': {} as any,
      },
      stream: vi.fn().mockImplementation(async (messages, options) => {
        onErrorCallback = options?.onError;

        // Return a mock stream that simulates the AI SDK behavior
        return {
          fullStream: {
            async *[Symbol.asyncIterator]() {
              // 1. Agent starts with text
              streamEvents.push('STREAM: Starting analysis...');
              yield {
                type: 'text-delta',
                textDelta: "I'll analyze your data. Let me use a tool...",
              };

              // 2. Agent attempts to call a non-existent tool
              streamEvents.push('STREAM: Tool call attempted');
              yield {
                type: 'tool-call',
                toolCallId: 'call_123',
                toolName: 'non-existent-analytics-tool',
                args: { data: 'analyze this' },
              };

              // 3. Simulate the AI SDK detecting the tool doesn't exist
              const toolError = new NoSuchToolError({
                toolName: 'non-existent-analytics-tool',
                availableTools: ['valid-tool-1', 'valid-tool-2'],
              });
              (toolError as any).toolCallId = 'call_123';

              streamEvents.push('ERROR: NoSuchToolError occurred');

              // 4. Call onError to get healing response
              if (onErrorCallback) {
                const healingResponse = onErrorCallback(toolError);
                streamEvents.push(`HEALING: ${JSON.stringify(healingResponse)}`);

                // 5. Inject the healing response as a tool result
                yield {
                  type: 'tool-result',
                  toolCallId: 'call_123',
                  toolName: 'non-existent-analytics-tool',
                  result: healingResponse,
                };
              }

              // 6. Agent continues after seeing the error
              streamEvents.push('STREAM: Agent continuing after healing');
              yield {
                type: 'text-delta',
                textDelta: '\n\nI apologize for the error. Let me use a different approach...',
              };

              // 7. Agent now uses a valid tool
              streamEvents.push('STREAM: Using valid tool');
              yield {
                type: 'tool-call',
                toolCallId: 'call_456',
                toolName: 'valid-tool-1',
                args: { data: 'analyze this' },
              };

              // 8. Valid tool executes successfully
              yield {
                type: 'tool-result',
                toolCallId: 'call_456',
                toolName: 'valid-tool-1',
                result: { success: true, data: 'Analysis complete' },
              };

              // 9. Agent completes
              streamEvents.push('STREAM: Completed successfully');
              yield { type: 'text-delta', textDelta: '\n\nAnalysis complete!' };
            },
          },
        };
      }),
    } as any;

    // Track what happens during execution
    const executionLog = {
      healingAttempts: 0,
      chunksProcessed: 0,
      toolCallsSeen: [] as string[],
      errorMessages: [] as string[],
    };

    // Run the healing stream
    const result = await retryableAgentStreamWithHealing({
      agent: mockAgent,
      messages: [{ role: 'user', content: 'Analyze my sales data' }],
      options: {
        toolCallStreaming: true,
        runtimeContext: {} as any,
      },
      retryConfig: {
        maxRetries: 3,
        onRetry: (error, attempt) => {
          executionLog.healingAttempts++;
          if (error.healingMessage.role === 'tool' && Array.isArray(error.healingMessage.content)) {
            const toolResult = error.healingMessage.content[0];
            if ('result' in toolResult && toolResult.result && 'error' in toolResult.result) {
              executionLog.errorMessages.push(toolResult.result.error as string);
            }
          }
        },
      },
    });

    // Process the stream and track what happens
    const chunks: TextStreamPart<any>[] = [];
    for await (const chunk of result.stream.fullStream) {
      chunks.push(chunk);
      executionLog.chunksProcessed++;

      if (chunk.type === 'tool-call') {
        executionLog.toolCallsSeen.push(chunk.toolName);
      }
    }

    // VERIFICATION: The stream completed successfully with healing
    expect(result.stream).toBeDefined();
    expect(executionLog.healingAttempts).toBe(1);
    expect(executionLog.chunksProcessed).toBeGreaterThan(5);
    expect(executionLog.toolCallsSeen).toContain('non-existent-analytics-tool');
    expect(executionLog.toolCallsSeen).toContain('valid-tool-1');
    expect(executionLog.errorMessages[0]).toContain(
      'Tool "non-existent-analytics-tool" is not available'
    );
    expect(executionLog.errorMessages[0]).toContain('valid-tool-1');

    // Log the full execution flow
    console.log('\n🎬 STREAMING EXECUTION FLOW:');
    streamEvents.forEach((event) => console.log(`   ${event}`));

    console.log('\n📊 EXECUTION SUMMARY:');
    console.log(`   - Healing attempts: ${executionLog.healingAttempts}`);
    console.log(`   - Chunks processed: ${executionLog.chunksProcessed}`);
    console.log(`   - Tool calls seen: ${executionLog.toolCallsSeen.join(', ')}`);
    console.log(`   - Error healed: YES`);
    console.log(`   - Stream completed: YES`);

    console.log('\n✅ STREAMING HEALING SIMULATION SUCCESSFUL!');
  });

  it('SIMULATION: Real-world scenario with think-and-prep agent', async () => {
    // Simulate the exact scenario: think-and-prep tries to create metrics
    let healingMessage = '';

    const mockThinkPrepAgent: MastraAgent = {
      name: 'think-and-prep',
      tools: {
        sequentialThinking: {} as any,
        executeSql: {} as any,
        respondWithoutAnalysis: {} as any,
        submitThoughts: {} as any,
      },
      stream: vi.fn().mockImplementation(async (messages, options) => {
        const onError = options?.onError;

        return {
          fullStream: {
            async *[Symbol.asyncIterator]() {
              // Think-and-prep agent mistakenly tries to create a metrics file
              yield {
                type: 'text-delta',
                textDelta: 'I need to create a metrics file for this analysis...',
              };

              // Attempts to call create-metrics-file (which it doesn't have!)
              yield {
                type: 'tool-call',
                toolCallId: 'think_prep_bad_call',
                toolName: 'create-metrics-file',
                args: { files: [] },
              };

              // Error occurs
              const error = new NoSuchToolError({
                toolName: 'create-metrics-file',
                availableTools: [
                  'sequentialThinking',
                  'executeSql',
                  'respondWithoutAnalysis',
                  'submitThoughts',
                ],
              });
              (error as any).toolCallId = 'think_prep_bad_call';

              // Get healing response
              if (onError) {
                const healing = onError(error);
                healingMessage = (healing as any).error;

                yield {
                  type: 'tool-result',
                  toolCallId: 'think_prep_bad_call',
                  toolName: 'create-metrics-file',
                  result: healing,
                };
              }

              // Agent corrects itself
              yield { type: 'text-delta', textDelta: '\n\nI should use submitThoughts instead...' };

              // Uses correct tool
              yield {
                type: 'tool-call',
                toolCallId: 'correct_call',
                toolName: 'submitThoughts',
                args: { thoughts: 'Analysis plan...' },
              };
            },
          },
        };
      }),
    } as any;

    const result = await retryableAgentStreamWithHealing({
      agent: mockThinkPrepAgent,
      messages: [{ role: 'user', content: 'Create a dashboard' }],
      options: { runtimeContext: {} as any },
    });

    // Process the stream
    const events: string[] = [];
    for await (const chunk of result.stream.fullStream) {
      if (chunk.type === 'tool-call') {
        events.push(`Tool called: ${chunk.toolName}`);
      } else if (chunk.type === 'tool-result' && chunk.result?.error) {
        events.push(`Error healed: ${chunk.result.error}`);
      }
    }

    // Verify the exact scenario was handled
    expect(healingMessage).toContain('Tool "create-metrics-file" is not available');
    expect(healingMessage).toContain('sequentialThinking');
    expect(healingMessage).toContain('submitThoughts');
    expect(events).toContain('Tool called: create-metrics-file');
    expect(events).toContain('Tool called: submitThoughts');

    console.log('\n✅ THINK-AND-PREP AGENT HEALING VERIFIED!');
    console.log('   - Agent tried to use create-metrics-file');
    console.log('   - Got healed with list of available tools');
    console.log('   - Successfully used submitThoughts instead');
  });
});
