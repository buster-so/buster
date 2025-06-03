import { RuntimeContext } from '@mastra/core/runtime-context';
import { initLogger, wrapTraced } from 'braintrust';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { thinkAndPrepAgent } from '../../../src/agents/think-and-prep-agent/think-and-prep-agent';
import type { AnalystRuntimeContext } from '../../../src/workflows/analyst-workflow';

describe('Think and Prep Agent Integration Tests', () => {
  beforeAll(async () => {
    initLogger({
      apiKey: process.env.BRAINTRUST_KEY,
      projectName: 'THINK-AND-PREP-AGENT',
    });
  });

  afterAll(async () => {
    // Cleanup if needed
    // Wait 500ms before finishing
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  test('should generate response for analysis query', async () => {
    const tracedAgentWorkflow = wrapTraced(
      async (input: string) => {
        // Step 1: Generate response with analyst agent
        try {
          // Create runtime context with required properties
          const runtimeContext = new RuntimeContext<AnalystRuntimeContext>([
            ['userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e'],
            ['threadId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e'],
            ['dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a'],
            ['dataSourceSyntax', 'postgresql'],
            ['organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce'],
          ]);

          const response = await thinkAndPrepAgent.generate(input, {
            maxSteps: 15,
            runtimeContext,
          });

          return response;
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
      { name: 'ThinkAndPrepAgent' }
    );

    // Execute the workflow
    const response = await tracedAgentWorkflow(
      'For the merchant Nani Swimwear, we need to see the the last 6 months return rate by revenue, item, and order. Please make sure the sales channel is only online store.'
    );

    // Verify response structure
    expect(response).toBeDefined();
    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');
    expect(response.text.length).toBeGreaterThan(0);
  }, 0);
});
