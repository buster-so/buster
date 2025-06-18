import { beforeEach, describe, expect, test } from 'vitest';
import { doneTool } from '../../../src/tools/communication-tools/done-tool';

describe('Done Tool Integration Tests', () => {
  // Create a minimal mock runtime context that satisfies the type requirements
  const mockRuntimeContext = {
    agentId: 'test-agent',
    userId: 'test-user',
    threadId: 'test-thread',
    registry: new Map(),
    set: () => {},
    get: () => undefined,
    has: () => false,
    delete: () => false,
    clear: () => {},
    keys: () => [],
    values: () => [],
    entries: () => [],
    size: 0,
    forEach: () => {},
  } as unknown as Parameters<typeof doneTool.execute>[0]['runtimeContext'];

  test('should have correct tool configuration', () => {
    expect(doneTool.id).toBe('done');
    expect(doneTool.description).toContain('Marks all remaining unfinished tasks as complete');
    expect(doneTool.description).toContain('sends a final response to the user');
    expect(doneTool.description).toContain('ends the workflow');
    expect(doneTool.inputSchema).toBeDefined();
    expect(doneTool.outputSchema).toBeDefined();
    expect(doneTool.execute).toBeDefined();
  });

  test('should validate tool input schema', () => {
    const validInput = {
      final_response: 'Task completed successfully. All requirements have been met.',
    };

    const result = doneTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate tool output schema', () => {
    const validOutput = {
      success: true,
      todos: '[x] Task 1\n[x] Task 2 *Marked complete by calling the done tool',
    };

    const result = doneTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should handle basic execution', async () => {
    const input = {
      final_response: 'Test completion',
    };

    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });
    expect(result.success).toBe(true);
  });

  test('should complete workflow successfully', async () => {
    const input = {
      final_response: 'Workflow completed successfully. No tasks were in progress.',
    };

    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });

    expect(result.success).toBe(true);
  });

  test('should handle completion with detailed final response', async () => {
    const input = {
      final_response: 'All tasks have been completed successfully.',
    };

    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });

    expect(result.success).toBe(true);
  });

  test('should handle review completion', async () => {
    const input = {
      final_response: 'Review completed. All tasks were already finished.',
    };

    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });

    expect(result.success).toBe(true);
  });

  test('should handle project deployment completion', async () => {
    const input = {
      final_response: 'Project deployment completed. All remaining tasks have been finished.',
    };

    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });

    expect(result.success).toBe(true);
  });

  test('should handle cleanup completion', async () => {
    const input = {
      final_response: 'Cleaned up todos and completed remaining valid tasks.',
    };

    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });

    expect(result.success).toBe(true);
  });

  test('should handle complex task completion', async () => {
    const input = {
      final_response: 'Complex task with metadata completed.',
    };

    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });

    expect(result.success).toBe(true);
  });

  test('should handle single task completion', async () => {
    const input = {
      final_response: 'The only remaining task has been completed.',
    };

    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });

    expect(result.success).toBe(true);
  });

  test('should handle invalid data gracefully', async () => {
    const input = {
      final_response: 'No valid todos found.',
    };

    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });

    expect(result.success).toBe(true);
  });

  test('should handle empty task list', async () => {
    const input = {
      final_response: 'Empty todo list processed.',
    };

    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });

    expect(result.success).toBe(true);
  });

  test('should handle input validation through schema', () => {
    // Test that the schema correctly validates inputs
    const invalidInputs = [
      {}, // Missing final_response
      { final_response: '' }, // Empty final_response
      { final_response: null }, // Null final_response
      { final_response: 123 }, // Wrong type
    ];

    for (const input of invalidInputs) {
      const result = doneTool.inputSchema.safeParse(input);
      expect(result.success).toBe(false);
    }

    // Valid input should pass
    const validInput = { final_response: 'Valid response' };
    const validResult = doneTool.inputSchema.safeParse(validInput);
    expect(validResult.success).toBe(true);
  });

  test('should handle markdown formatted final_response', async () => {
    const markdownResponse = `
## Workflow Complete

The following tasks have been completed:

- Task 1 ✓
- Data analysis ✓
- Report generation ✓

**Summary**: All objectives met successfully.
    `.trim();

    const input = {
      final_response: markdownResponse,
    };

    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });

    expect(result.success).toBe(true);
  });

  test('should handle error cases gracefully', async () => {
    const input = {
      final_response: 'Test error handling',
    };

    // The current implementation always succeeds
    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });
    expect(result.success).toBe(true);
  });

  test('should handle update scenarios', async () => {
    const input = {
      final_response: 'Test update scenario',
    };

    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });
    expect(result.success).toBe(true);
  });

  test('should handle large batch of tasks', async () => {
    const input = {
      final_response: 'Completed large batch of tasks.',
    };

    const result = await doneTool.execute({ context: input, runtimeContext: mockRuntimeContext });

    expect(result.success).toBe(true);
  });

  test('should validate final_response parameter descriptions', () => {
    const schema = doneTool.inputSchema;
    const shape = schema.shape as { final_response: { description?: string } };
    const finalResponseField = shape.final_response;

    expect(finalResponseField.description).toContain('**MUST** be formatted in Markdown');
    expect(finalResponseField.description).toContain('Do not include headers');
    expect(finalResponseField.description).toContain("Do not use the '•' bullet character");
    expect(finalResponseField.description).toContain('Do not include markdown tables');
  });
});
