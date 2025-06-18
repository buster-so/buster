import { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { initLogger, wrapTraced } from 'braintrust';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { analystAgent } from '../../../src/agents/analyst-agent/analyst-agent';
import type { AnalystRuntimeContext } from '../../../src/workflows/analyst-workflow';

describe('Analyst Agent Integration Tests', () => {
  beforeAll(async () => {
    initLogger({
      apiKey: process.env.BRAINTRUST_KEY,
      projectName: 'ANALYST-AGENT',
    });
  });

  afterAll(async () => {
    // Cleanup if needed
    // Wait 500ms before finishing
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  test('should generate response for data analysis query with conversation history', async () => {
    // Stubbed conversation history - to be filled in later
    const conversationHistory: CoreMessage[] = [
      // TODO: Add stubbed conversation history here
    ];

    const tracedAgentWorkflow = wrapTraced(
      async (messages: CoreMessage[]) => {
        // Step 1: Generate response with analyst agent using conversation history
        try {
          const chatId = 'da05b6fb-01b2-4c1c-bc7f-7e55029a5c75';
          const resourceId = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';

          // Create runtime context with required properties
          const runtimeContext = new RuntimeContext<AnalystRuntimeContext>([
            ['userId', resourceId],
            ['chatId', chatId],
            ['dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a'],
            ['dataSourceSyntax', 'postgres'],
            ['organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce'],
            // Note: No messageId provided for testing scenario
          ]);

          // Use stream with conversation history instead of single prompt
          const stream = await analystAgent.stream(messages, {
            maxSteps: 15,
            runtimeContext,
            onStepFinish: async (step) => {
              console.log('\n=== onStepFinish callback (with history) ===');
              console.log('Step structure:', JSON.stringify(step, null, 2));
              console.log('Tool calls:', step.toolCalls);
              console.log('Response messages:', step.response.messages);
              // Response text is not directly available on step.response
              console.log('===========================\n');
            },
          });

          let response = '';
          for await (const chunk of stream.fullStream) {
            if (chunk.type === 'text-delta') {
              response += chunk.textDelta;
            }
          }

          return response;
        } catch (error) {
          console.error('Error during agent execution:', error);
          throw error;
        }
      },
      { name: 'analyst-agent-with-history' }
    );

    // Test with conversation history (stubbed for now)
    const result = await tracedAgentWorkflow(
      conversationHistory.length > 0
        ? (conversationHistory as CoreMessage[])
        : [{ role: 'user', content: 'What are the top 5 customers by revenue?' }]
    );

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // Should have generated some analysis response
    expect(result).not.toBe('');
    console.log('Final result:', result);
  }, 300000);

  test('should generate response for analysis query', async () => {
    const tracedAgentWorkflow = wrapTraced(
      async (input: string) => {
        // Step 1: Generate response with analyst agent
        try {
          const chatId = 'da05b6fb-01b2-4c1c-bc7f-7e55029a5c75';
          const resourceId = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';

          // Create runtime context with required properties
          const runtimeContext = new RuntimeContext<AnalystRuntimeContext>([
            ['userId', resourceId],
            ['chatId', chatId],
            ['dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a'],
            ['dataSourceSyntax', 'postgresql'],
            ['organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce'],
          ]);

          const stream = await analystAgent.stream(input, {
            maxSteps: 15,
            runtimeContext,
          });

          let responseText = '';
          for await (const chunk of stream.fullStream) {
            if (chunk.type === 'text-delta') {
              responseText += chunk.textDelta;
            }
          }

          return responseText;
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
      { name: 'AnalystAgentWorkflow' }
    );

    // Execute the workflow
    const response = await tracedAgentWorkflow('please continue with the analysis');

    // Verify response structure
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  }, 300000);
});
