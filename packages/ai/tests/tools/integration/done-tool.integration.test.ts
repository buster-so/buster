import { doneTool } from '../../../src/tools/communication-tools/done-tool';
import { beforeEach, describe, expect, test } from 'vitest';

describe('Done Tool Integration Tests', () => {
  let mockRuntimeContext: any;

  beforeEach(() => {
    mockRuntimeContext = {
      state: new Map<string, any>(),
      get: function (key: string) {
        return this.state.get(key);
      },
      set: function (key: string, value: any) {
        this.state.set(key, value);
      },
      clear: function () {
        this.state.clear();
      },
    };
  });

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

  test('should handle runtime context requirements', async () => {
    const contextWithoutGet = {
      set: (key: string, value: any) => {},
    };

    const input = {
      final_response: 'Test completion',
      runtimeContext: contextWithoutGet,
    };

    // The tool should now gracefully handle missing runtime context
    const result = await doneTool.execute({ context: input });
    expect(result.success).toBe(true);
    expect(result.todos).toBe('No to-do list found.');
  });

  test('should complete workflow when no todos exist', async () => {
    const input = {
      final_response: 'Workflow completed successfully. No tasks were in progress.',
      runtimeContext: mockRuntimeContext,
    };

    const result = await doneTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe('No to-do list found.');
  });

  test('should mark incomplete todos as complete', async () => {
    // Setup initial todos
    mockRuntimeContext.set('todos', [
      { todo: 'Create dashboard', completed: false },
      { todo: 'Generate reports', completed: false },
      { todo: 'Analyze data', completed: true }, // Already completed
    ]);

    const input = {
      final_response: 'All tasks have been completed successfully.',
      runtimeContext: mockRuntimeContext,
    };

    const result = await doneTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe(
      '[x] Create dashboard *Marked complete by calling the done tool\n' +
        '[x] Generate reports *Marked complete by calling the done tool\n' +
        '[x] Analyze data'
    );

    // Verify state was updated
    const updatedTodos = mockRuntimeContext.get('todos');
    expect(updatedTodos).toHaveLength(3);
    expect(updatedTodos.every((todo: any) => todo.completed)).toBe(true);
  });

  test('should handle all todos already completed', async () => {
    // Setup todos that are all completed
    mockRuntimeContext.set('todos', [
      { todo: 'Task 1', completed: true },
      { todo: 'Task 2', completed: true },
      { todo: 'Task 3', completed: true },
    ]);

    const input = {
      final_response: 'Review completed. All tasks were already finished.',
      runtimeContext: mockRuntimeContext,
    };

    const result = await doneTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe('[x] Task 1\n[x] Task 2\n[x] Task 3');

    // Should not contain any "marked complete" annotations
    expect(result.todos).not.toContain('*Marked complete by calling the done tool');
  });

  test('should handle mixed todo completion states', async () => {
    mockRuntimeContext.set('todos', [
      { todo: 'Setup database', completed: true },
      { todo: 'Create API endpoints', completed: false },
      { todo: 'Write documentation', completed: true },
      { todo: 'Deploy to production', completed: false },
      { todo: 'Configure monitoring', completed: false },
    ]);

    const input = {
      final_response: 'Project deployment completed. All remaining tasks have been finished.',
      runtimeContext: mockRuntimeContext,
    };

    const result = await doneTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe(
      '[x] Setup database\n' +
        '[x] Create API endpoints *Marked complete by calling the done tool\n' +
        '[x] Write documentation\n' +
        '[x] Deploy to production *Marked complete by calling the done tool\n' +
        '[x] Configure monitoring *Marked complete by calling the done tool'
    );

    // Verify state was properly updated
    const updatedTodos = mockRuntimeContext.get('todos');
    expect(updatedTodos.filter((todo: any) => !todo.completed)).toHaveLength(0);
  });

  test('should handle invalid todo data gracefully', async () => {
    // Setup todos with some invalid entries
    mockRuntimeContext.set('todos', [
      { todo: 'Valid task 1', completed: false },
      { invalid: 'structure' }, // Missing required fields
      null, // Null item
      'string item', // Wrong type
      { todo: 'Valid task 2', completed: true },
      { completed: false }, // Missing todo field
      { todo: 'Valid task 3', completed: false },
    ]);

    const input = {
      final_response: 'Cleaned up todos and completed remaining valid tasks.',
      runtimeContext: mockRuntimeContext,
    };

    const result = await doneTool.execute({ context: input });

    expect(result.success).toBe(true);
    // Should only show valid todos
    expect(result.todos).toBe(
      '[x] Valid task 1 *Marked complete by calling the done tool\n' +
        '[x] Valid task 2\n' +
        '[x] Valid task 3 *Marked complete by calling the done tool'
    );
  });

  test('should preserve todo properties when marking complete', async () => {
    mockRuntimeContext.set('todos', [
      {
        todo: 'Complex task',
        completed: false,
        priority: 'high',
        assignee: 'john.doe@example.com',
        tags: ['backend', 'api'],
        dueDate: '2024-12-31',
      },
    ]);

    const input = {
      final_response: 'Complex task with metadata completed.',
      runtimeContext: mockRuntimeContext,
    };

    const result = await doneTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe('[x] Complex task *Marked complete by calling the done tool');

    // Verify all properties were preserved
    const updatedTodos = mockRuntimeContext.get('todos');
    const task = updatedTodos[0];
    expect(task.completed).toBe(true);
    expect(task.priority).toBe('high');
    expect(task.assignee).toBe('john.doe@example.com');
    expect(task.tags).toEqual(['backend', 'api']);
    expect(task.dueDate).toBe('2024-12-31');
  });

  test('should handle single todo item', async () => {
    mockRuntimeContext.set('todos', [{ todo: 'Single task to complete', completed: false }]);

    const input = {
      final_response: 'The only remaining task has been completed.',
      runtimeContext: mockRuntimeContext,
    };

    const result = await doneTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe(
      '[x] Single task to complete *Marked complete by calling the done tool'
    );
  });

  test('should handle non-array todos data', async () => {
    // Test various non-array values
    const nonArrayValues = [null, undefined, 'string', 123, { object: 'value' }, true];

    for (const value of nonArrayValues) {
      mockRuntimeContext.clear();
      mockRuntimeContext.set('todos', value);

      const input = {
        final_response: 'No valid todos found.',
        runtimeContext: mockRuntimeContext,
      };

      const result = await doneTool.execute({ context: input });

      expect(result.success).toBe(true);
      expect(result.todos).toBe('No to-do list found.');
    }
  });

  test('should handle empty todos array', async () => {
    mockRuntimeContext.set('todos', []);

    const input = {
      final_response: 'Empty todo list processed.',
      runtimeContext: mockRuntimeContext,
    };

    const result = await doneTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe('No to-do list found.');
  });

  test('should handle input validation through schema', () => {
    // Test that the schema correctly validates inputs
    const invalidInputs = [
      {}, // Missing final_response
      { final_response: '' }, // Empty final_response
      { final_response: null }, // Null final_response
      { final_response: 123 }, // Wrong type
    ];

    invalidInputs.forEach((input) => {
      const result = doneTool.inputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    // Valid input should pass
    const validInput = { final_response: 'Valid response' };
    const validResult = doneTool.inputSchema.safeParse(validInput);
    expect(validResult.success).toBe(true);
  });

  test('should handle markdown formatted final_response', async () => {
    mockRuntimeContext.set('todos', [{ todo: 'Task 1', completed: false }]);

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
      runtimeContext: mockRuntimeContext,
    };

    const result = await doneTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe('[x] Task 1 *Marked complete by calling the done tool');
  });

  test('should handle runtime context state access errors', async () => {
    const faultyContext = {
      get: () => {
        throw new Error('State access failed');
      },
      set: () => {},
    };

    const input = {
      final_response: 'Test error handling',
      runtimeContext: faultyContext,
    };

    await expect(doneTool.execute({ context: input })).rejects.toThrow('State access failed');
  });

  test('should handle runtime context state update errors', async () => {
    const faultyContext = {
      get: () => [{ todo: 'Test task', completed: false }],
      set: () => {
        throw new Error('State update failed');
      },
    };

    const input = {
      final_response: 'Test update error',
      runtimeContext: faultyContext,
    };

    await expect(doneTool.execute({ context: input })).rejects.toThrow('State update failed');
  });

  test('should handle large number of todos', async () => {
    // Create 100 todos with mixed completion states
    const largeTodoList = Array.from({ length: 100 }, (_, i) => ({
      todo: `Task ${i + 1}`,
      completed: i % 3 === 0, // Every 3rd task is completed
    }));

    mockRuntimeContext.set('todos', largeTodoList);

    const input = {
      final_response: 'Completed large batch of tasks.',
      runtimeContext: mockRuntimeContext,
    };

    const result = await doneTool.execute({ context: input });

    expect(result.success).toBe(true);

    // Verify all todos are now completed
    const updatedTodos = mockRuntimeContext.get('todos');
    expect(updatedTodos).toHaveLength(100);
    expect(updatedTodos.every((todo: any) => todo.completed)).toBe(true);

    // Check output format
    const todoLines = result.todos.split('\n');
    expect(todoLines).toHaveLength(100);

    // Count how many were marked by done tool (should be ~67 since every 3rd was already done)
    const markedByDone = todoLines.filter((line) =>
      line.includes('*Marked complete by calling the done tool')
    );
    expect(markedByDone.length).toBeGreaterThan(60); // Approximately 67
    expect(markedByDone.length).toBeLessThan(70);
  });

  test('should validate final_response parameter descriptions match Rust implementation', () => {
    const schema = doneTool.inputSchema;
    const shape = schema.shape as any;
    const finalResponseField = shape.final_response;

    expect(finalResponseField.description).toContain('**MUST** be formatted in Markdown');
    expect(finalResponseField.description).toContain('Do not include headers');
    expect(finalResponseField.description).toContain("Do not use the '•' bullet character");
    expect(finalResponseField.description).toContain('Do not include markdown tables');
  });
});
