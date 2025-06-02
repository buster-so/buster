import { reviewPlanTool } from '@/tools/planning-thinking-tools/review-plan-tool';
import { beforeEach, describe, expect, test } from 'vitest';

describe('Review Plan Tool Integration Tests', () => {
  let mockRuntimeContext: any;

  beforeEach(() => {
    mockRuntimeContext = {
      state: new Map<string, any>(),
      get: function(key: string) {
        return this.state.get(key);
      },
      set: function(key: string, value: any) {
        this.state.set(key, value);
      },
      clear: function() {
        this.state.clear();
      }
    };
  });

  test('should have correct tool configuration', () => {
    expect(reviewPlanTool.id).toBe('review-plan');
    expect(reviewPlanTool.description).toBe('Marks one or more tasks as complete by their 1-based indices in the to-do list.');
    expect(reviewPlanTool.inputSchema).toBeDefined();
    expect(reviewPlanTool.outputSchema).toBeDefined();
    expect(reviewPlanTool.execute).toBeDefined();
  });

  test('should validate tool input schema', () => {
    const validInput = {
      todo_items: [1, 2, 3]
    };

    const result = reviewPlanTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate tool output schema', () => {
    const validOutput = {
      success: true,
      todos: '[x] Task 1\n[ ] Task 2\n[x] Task 3'
    };

    const result = reviewPlanTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should handle runtime context requirements', async () => {
    const contextWithoutGet = {
      set: (key: string, value: any) => {}
    };

    const input = {
      todo_items: [1],
      runtimeContext: contextWithoutGet
    };

    // This should fail because get is missing
    await expect(reviewPlanTool.execute({ context: input }))
      .rejects.toThrow();
  });

  test('should mark single todo as complete', async () => {
    // Setup initial todos
    mockRuntimeContext.set('todos', [
      { todo: 'Create dashboard', completed: false },
      { todo: 'Generate reports', completed: false },
      { todo: 'Analyze data', completed: false }
    ]);

    const input = {
      todo_items: [2], // Mark second todo complete
      runtimeContext: mockRuntimeContext
    };

    const result = await reviewPlanTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe(
      '[ ] Create dashboard\n' +
      '[x] Generate reports\n' +
      '[ ] Analyze data'
    );

    // Verify state was updated
    const updatedTodos = mockRuntimeContext.get('todos');
    expect(updatedTodos[0].completed).toBe(false);
    expect(updatedTodos[1].completed).toBe(true);
    expect(updatedTodos[2].completed).toBe(false);

    // Verify review_needed flag was set to false
    expect(mockRuntimeContext.get('review_needed')).toBe(false);
  });

  test('should mark multiple todos as complete', async () => {
    // Setup initial todos
    mockRuntimeContext.set('todos', [
      { todo: 'Task 1', completed: false },
      { todo: 'Task 2', completed: false },
      { todo: 'Task 3', completed: false },
      { todo: 'Task 4', completed: false },
      { todo: 'Task 5', completed: false }
    ]);

    const input = {
      todo_items: [1, 3, 5], // Mark first, third, and fifth todos complete
      runtimeContext: mockRuntimeContext
    };

    const result = await reviewPlanTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe(
      '[x] Task 1\n' +
      '[ ] Task 2\n' +
      '[x] Task 3\n' +
      '[ ] Task 4\n' +
      '[x] Task 5'
    );

    // Verify state was updated correctly
    const updatedTodos = mockRuntimeContext.get('todos');
    expect(updatedTodos[0].completed).toBe(true);
    expect(updatedTodos[1].completed).toBe(false);
    expect(updatedTodos[2].completed).toBe(true);
    expect(updatedTodos[3].completed).toBe(false);
    expect(updatedTodos[4].completed).toBe(true);
  });

  test('should handle marking already completed todos', async () => {
    // Setup todos with some already completed
    mockRuntimeContext.set('todos', [
      { todo: 'Already done', completed: true },
      { todo: 'Needs completion', completed: false },
      { todo: 'Also done', completed: true }
    ]);

    const input = {
      todo_items: [1, 2], // Mark first (already done) and second
      runtimeContext: mockRuntimeContext
    };

    const result = await reviewPlanTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe(
      '[x] Already done\n' +
      '[x] Needs completion\n' +
      '[x] Also done'
    );

    // Verify all are now completed
    const updatedTodos = mockRuntimeContext.get('todos');
    expect(updatedTodos.every((todo: any) => todo.completed)).toBe(true);
  });

  test('should handle todos with additional properties', async () => {
    mockRuntimeContext.set('todos', [
      { 
        todo: 'Complex task', 
        completed: false, 
        priority: 'high',
        assignee: 'john.doe@example.com',
        tags: ['backend', 'api'],
        dueDate: '2024-12-31'
      },
      {
        todo: 'Simple task',
        completed: false
      }
    ]);

    const input = {
      todo_items: [1], // Mark first todo complete
      runtimeContext: mockRuntimeContext
    };

    const result = await reviewPlanTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe('[x] Complex task\n[ ] Simple task');

    // Verify all properties were preserved
    const updatedTodos = mockRuntimeContext.get('todos');
    const complexTask = updatedTodos[0];
    expect(complexTask.completed).toBe(true);
    expect(complexTask.priority).toBe('high');
    expect(complexTask.assignee).toBe('john.doe@example.com');
    expect(complexTask.tags).toEqual(['backend', 'api']);
    expect(complexTask.dueDate).toBe('2024-12-31');
  });

  test('should handle single todo list', async () => {
    mockRuntimeContext.set('todos', [
      { todo: 'Only task', completed: false }
    ]);

    const input = {
      todo_items: [1], // Mark the only todo complete
      runtimeContext: mockRuntimeContext
    };

    const result = await reviewPlanTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe('[x] Only task');

    // Verify state was updated
    const updatedTodos = mockRuntimeContext.get('todos');
    expect(updatedTodos[0].completed).toBe(true);
  });

  test('should reject invalid indices', async () => {
    mockRuntimeContext.set('todos', [
      { todo: 'Task 1', completed: false },
      { todo: 'Task 2', completed: false }
    ]);

    // Test zero index
    const zeroIndexInput = {
      todo_items: [0],
      runtimeContext: mockRuntimeContext
    };

    await expect(reviewPlanTool.execute({ context: zeroIndexInput }))
      .rejects.toThrow('todo_item index cannot be 0, indexing starts from 1.');

    // Test out of range index
    const outOfRangeInput = {
      todo_items: [5],
      runtimeContext: mockRuntimeContext
    };

    await expect(reviewPlanTool.execute({ context: outOfRangeInput }))
      .rejects.toThrow('todo_item index 5 out of range (2 todos, 1-based)');
  });

  test('should handle missing todos gracefully', async () => {
    // No todos in state
    const input = {
      todo_items: [1],
      runtimeContext: mockRuntimeContext
    };

    await expect(reviewPlanTool.execute({ context: input }))
      .rejects.toThrow("Could not find 'todos' in agent state or it's not an array.");
  });

  test('should handle invalid todo data gracefully', async () => {
    // Setup todos with some invalid entries
    mockRuntimeContext.set('todos', [
      { todo: 'Valid task 1', completed: false },
      { invalid: 'structure' }, // This will be filtered out
      null, // This will be filtered out
      'string item', // This will be filtered out
      { todo: 'Valid task 2', completed: false }
    ]);

    const input = {
      todo_items: [2], // Should refer to the second valid task
      runtimeContext: mockRuntimeContext
    };

    const result = await reviewPlanTool.execute({ context: input });

    expect(result.success).toBe(true);
    // Only valid todos should appear in output
    expect(result.todos).toBe('[ ] Valid task 1\n[x] Valid task 2');
  });

  test('should handle duplicate indices', async () => {
    mockRuntimeContext.set('todos', [
      { todo: 'Task 1', completed: false },
      { todo: 'Task 2', completed: false }
    ]);

    const input = {
      todo_items: [1, 1, 2, 1], // Duplicate indices
      runtimeContext: mockRuntimeContext
    };

    const result = await reviewPlanTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe('[x] Task 1\n[x] Task 2');

    // Both tasks should be completed despite duplicates
    const updatedTodos = mockRuntimeContext.get('todos');
    expect(updatedTodos[0].completed).toBe(true);
    expect(updatedTodos[1].completed).toBe(true);
  });

  test('should handle large todo list', async () => {
    // Create 50 todos
    const largeTodoList = Array.from({ length: 50 }, (_, i) => ({
      todo: `Task ${i + 1}`,
      completed: false
    }));

    mockRuntimeContext.set('todos', largeTodoList);

    // Mark every 5th task complete (1, 6, 11, 16, ...)
    const indicesToComplete = Array.from({ length: 10 }, (_, i) => i * 5 + 1);

    const input = {
      todo_items: indicesToComplete,
      runtimeContext: mockRuntimeContext
    };

    const result = await reviewPlanTool.execute({ context: input });

    expect(result.success).toBe(true);

    // Verify correct tasks were marked complete
    const updatedTodos = mockRuntimeContext.get('todos');
    for (let i = 0; i < updatedTodos.length; i++) {
      const shouldBeCompleted = indicesToComplete.includes(i + 1); // Convert to 1-based
      expect(updatedTodos[i].completed).toBe(shouldBeCompleted);
    }

    // Count completed tasks
    const completedCount = updatedTodos.filter((todo: any) => todo.completed).length;
    expect(completedCount).toBe(10);
  });

  test('should handle edge case index values', async () => {
    mockRuntimeContext.set('todos', [
      { todo: 'First task', completed: false },
      { todo: 'Last task', completed: false }
    ]);

    // Test first index (1)
    const firstInput = {
      todo_items: [1],
      runtimeContext: mockRuntimeContext
    };

    const firstResult = await reviewPlanTool.execute({ context: firstInput });
    expect(firstResult.todos).toBe('[x] First task\n[ ] Last task');

    // Reset state
    mockRuntimeContext.set('todos', [
      { todo: 'First task', completed: false },
      { todo: 'Last task', completed: false }
    ]);

    // Test last index (2)
    const lastInput = {
      todo_items: [2],
      runtimeContext: mockRuntimeContext
    };

    const lastResult = await reviewPlanTool.execute({ context: lastInput });
    expect(lastResult.todos).toBe('[ ] First task\n[x] Last task');
  });

  test('should handle runtime context state access errors', async () => {
    const faultyContext = {
      get: () => { throw new Error('State access failed'); },
      set: () => {}
    };

    const input = {
      todo_items: [1],
      runtimeContext: faultyContext
    };

    await expect(reviewPlanTool.execute({ context: input }))
      .rejects.toThrow('State access failed');
  });

  test('should handle runtime context state update errors', async () => {
    const faultyContext = {
      get: () => [{ todo: 'Test task', completed: false }],
      set: () => { throw new Error('State update failed'); }
    };

    const input = {
      todo_items: [1],
      runtimeContext: faultyContext
    };

    await expect(reviewPlanTool.execute({ context: input }))
      .rejects.toThrow('State update failed');
  });

  test('should verify review_needed flag is always set to false', async () => {
    mockRuntimeContext.set('todos', [
      { todo: 'Task 1', completed: false }
    ]);
    mockRuntimeContext.set('review_needed', true); // Initially true

    const input = {
      todo_items: [1],
      runtimeContext: mockRuntimeContext
    };

    await reviewPlanTool.execute({ context: input });

    // Verify flag was set to false
    expect(mockRuntimeContext.get('review_needed')).toBe(false);
  });

  test('should handle mixed completion states correctly', async () => {
    mockRuntimeContext.set('todos', [
      { todo: 'Completed task', completed: true },
      { todo: 'Incomplete task 1', completed: false },
      { todo: 'Incomplete task 2', completed: false },
      { todo: 'Another completed task', completed: true }
    ]);

    const input = {
      todo_items: [2, 3], // Mark the two incomplete tasks
      runtimeContext: mockRuntimeContext
    };

    const result = await reviewPlanTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe(
      '[x] Completed task\n' +
      '[x] Incomplete task 1\n' +
      '[x] Incomplete task 2\n' +
      '[x] Another completed task'
    );

    // Verify all tasks are now completed
    const updatedTodos = mockRuntimeContext.get('todos');
    expect(updatedTodos.every((todo: any) => todo.completed)).toBe(true);
  });

  test('should validate input schema correctly', () => {
    // Test valid inputs
    const validInputs = [
      { todo_items: [1] },
      { todo_items: [1, 2, 3] },
      { todo_items: [10, 5, 1] },
      { todo_items: [100] }
    ];

    validInputs.forEach(input => {
      const result = reviewPlanTool.inputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    // Test invalid inputs
    const invalidInputs = [
      {}, // Missing todo_items
      { todo_items: [] }, // Empty array
      { todo_items: [0] }, // Zero index
      { todo_items: [-1] }, // Negative index
      { todo_items: [1.5] }, // Non-integer
      { todo_items: 'not an array' }, // Wrong type
      { todo_items: [1, 0, 2] } // Mixed valid/invalid
    ];

    invalidInputs.forEach(input => {
      const result = reviewPlanTool.inputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  test('should format output consistently', async () => {
    const testCases = [
      {
        todos: [{ todo: 'Single incomplete', completed: false }],
        expected: '[ ] Single incomplete'
      },
      {
        todos: [{ todo: 'Single complete', completed: true }],
        expected: '[x] Single complete'
      },
      {
        todos: [
          { todo: 'Task A', completed: false },
          { todo: 'Task B', completed: true }
        ],
        expected: '[ ] Task A\n[x] Task B'
      }
    ];

    for (const testCase of testCases) {
      mockRuntimeContext.clear();
      mockRuntimeContext.set('todos', testCase.todos);

      const input = {
        todo_items: [1], // Just trigger the formatting
        runtimeContext: mockRuntimeContext
      };

      const result = await reviewPlanTool.execute({ context: input });
      
      // The first task will be marked complete, so adjust expectation
      const adjustedExpected = testCase.expected.replace('[ ] Task A', '[x] Task A')
                                                .replace('[ ] Single incomplete', '[x] Single incomplete');
      expect(result.todos).toBe(adjustedExpected);
    }
  });
});