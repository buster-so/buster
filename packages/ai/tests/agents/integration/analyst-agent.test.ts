import { wrapTraced } from 'braintrust';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { analystAgent } from '../../../src/agents/analyst-agent/analyst-agent';

describe('Analyst Agent Integration Tests', () => {
  beforeAll(async () => {});

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
          const response = await analystAgent.generate(input, {
            providerOptions: { anthropic: { cache_control: { type: 'ephemeral', ttl: '5m' } } },
          });

          await new Promise((resolve) => setTimeout(resolve, 500));

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
      'For the merchant Nani Swimwear, we need to see the the last 6 months return rate by revenue, item, and order. Please make sure the sales channel is only online store.'
    );

    // Verify response structure
    expect(response).toBeDefined();
    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');
    expect(response.text.length).toBeGreaterThan(0);
  }, 0);
});
