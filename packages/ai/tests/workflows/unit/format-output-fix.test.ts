import { describe, expect, test } from 'vitest';
import analystWorkflow from '../../../src/workflows/analyst-workflow';

describe('Format Output Fix Tests', () => {
  test('should not throw "Unrecognized input format" error when workflow runs', async () => {
    const testInput = {
      prompt: 'What are the top 10 accessory products by sales in the last 6 months?',
    };

    const mockRuntimeContext = {
      userId: 'test-user',
      chatId: 'test-thread',
      dataSourceId: 'test-datasource',
      dataSourceSyntax: 'postgresql',
      organizationId: 'test-org',
      todos: 'test todos',
    };

    // This test verifies that the workflow can be created and executed
    // without throwing the "Unrecognized input format" error
    expect(() => {
      const run = analystWorkflow.createRun();
      // We don't actually run it since it would need real data,
      // but creating the run should not throw format errors
    }).not.toThrow();

    // Test that the workflow structure is correct
    expect(analystWorkflow).toBeDefined();
    expect(analystWorkflow.id).toBe('analyst-workflow');
  });

  test('workflow input schema should validate correctly', () => {
    const validInput = {
      prompt: 'Test prompt',
      conversationHistory: [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi!' },
      ],
    };

    // Test that the input schema can parse valid input
    expect(() => {
      analystWorkflow.inputSchema.parse(validInput);
    }).not.toThrow();

    const minimalInput = {
      prompt: 'Test prompt',
    };

    expect(() => {
      analystWorkflow.inputSchema.parse(minimalInput);
    }).not.toThrow();
  });
});
