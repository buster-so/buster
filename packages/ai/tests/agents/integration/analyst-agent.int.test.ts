import { RuntimeContext } from '@mastra/core/runtime-context';
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

  test('should generate response for analysis query', async () => {
    const tracedAgentWorkflow = wrapTraced(
      async (input: string) => {
        // Step 1: Generate response with analyst agent
        try {
          const threadId = 'da05b6fb-01b2-4c1c-bc7f-7e55029a5c75';
          const resourceId = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';

          // Create runtime context with required properties
          const runtimeContext = new RuntimeContext<AnalystRuntimeContext>([
            ['userId', resourceId],
            ['threadId', threadId],
            ['dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a'],
            ['dataSourceSyntax', 'postgresql'],
            ['organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce'],
          ]);


          const response = await analystAgent.generate(input, {
            maxSteps: 15,
            threadId,
            resourceId,
            runtimeContext,
          });

          return response;
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
      { name: 'AnalystAgentWorkflow' }
    );

    // Execute the workflow
    const response = await tracedAgentWorkflow(
      'please continue with the analysis'
    );

    // Verify response structure
    expect(response).toBeDefined();
    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');
    expect(response.text.length).toBeGreaterThan(0);
  }, 0);
});
