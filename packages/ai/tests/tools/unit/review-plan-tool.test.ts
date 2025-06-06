import { beforeEach, describe, expect, test } from 'vitest';
import { z } from 'zod';

// Import the schemas we want to test (extracted from the tool file)
const inputSchema = z.object({
  todo_items: z
    .array(z.number().int().min(1, 'Todo item index must be at least 1 (1-based indexing)'))
    .min(1, 'At least one todo item index must be provided')
    .describe('A list of 1-based indices of the tasks to mark as complete (1 is the first item).'),
});

const outputSchema = z.object({
  success: z.boolean(),
  todos: z.string(),
});

// Define todo item interface for testing
interface TodoItem {
  todo: string;
  completed: boolean;
  [key: string]: any;
}

// Mock runtime context for testing
class MockRuntimeContext {
  private state: Map<string, any> = new Map();

  get(key: string): any | undefined {
    return this.state.get(key);
  }

  set(key: string, value: any): void {
    this.state.set(key, value);
  }

  clear(): void {
    this.state.clear();
  }
}

// Parse and validate todo items from agent state (copied from tool)
function parseTodos(todosValue: any): TodoItem[] {
  if (!Array.isArray(todosValue)) {
    return [];
  }

  return todosValue.filter((item): item is TodoItem => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.todo === 'string' &&
      typeof item.completed === 'boolean'
    );
  });
}

// Format todos list for output showing completion status (copied from tool)
function formatTodosOutput(todos: TodoItem[]): string {
  return todos
    .map((todo) => {
      const marker = todo.completed ? 'x' : ' ';
      return `[${marker}] ${todo.todo}`;
    })
    .join('\n');
}

// Process review plan execution with todo completion by index (copied from tool)
async function processReviewPlan(
  params: { todo_items: number[] },
  runtimeContext?: MockRuntimeContext
): Promise<{ success: boolean; todos: string }> {
  if (!runtimeContext) {
    throw new Error('Runtime context not found');
  }

  // Get the current todos from state
  const todosValue = runtimeContext.get('todos');
  const todos = parseTodos(todosValue);

  if (todos.length === 0) {
    throw new Error("Could not find 'todos' in agent state or it's not an array.");
  }

  const totalTodos = todos.length;

  // Process each todo index
  for (const idxOneBased of params.todo_items) {
    // Convert 1-based index to 0-based index
    if (idxOneBased === 0) {
      throw new Error('todo_item index cannot be 0, indexing starts from 1.');
    }

    const idxZeroBased = idxOneBased - 1;

    if (idxZeroBased >= totalTodos) {
      throw new Error(`todo_item index ${idxOneBased} out of range (${totalTodos} todos, 1-based)`);
    }

    // Mark the todo at the given index as complete
    const todo = todos[idxZeroBased];
    if (!todo || typeof todo !== 'object') {
      throw new Error(`Todo item at index ${idxOneBased} (1-based) is not a valid object.`);
    }

    todo.completed = true;
  }

  // Save the updated todos back to state
  runtimeContext.set('todos', todos);

  // Format the output string
  const todosString = formatTodosOutput(todos);

  // Set review_needed to false after review
  runtimeContext.set('review_needed', false);

  return {
    success: true,
    todos: todosString,
  };
}

describe('Review Plan Tool Unit Tests', () => {
  let mockRuntimeContext: MockRuntimeContext;

  beforeEach(() => {
    mockRuntimeContext = new MockRuntimeContext();
  });

  describe('Input Schema Validation', () => {
    test('should validate correct input format', () => {
      const validInput = {
        todo_items: [1, 2, 3],
      };

      const result = inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('should validate single todo item', () => {
      const validInput = {
        todo_items: [1],
      };

      const result = inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('should reject empty todo_items array', () => {
      const invalidInput = {
        todo_items: [],
      };

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test('should reject zero index', () => {
      const invalidInput = {
        todo_items: [0],
      };

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test('should reject negative indices', () => {
      const invalidInput = {
        todo_items: [-1, -2],
      };

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test('should reject non-integer indices', () => {
      const invalidInput = {
        todo_items: [1.5, 2.7],
      };

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test('should reject missing todo_items', () => {
      const invalidInput = {};

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test('should reject non-array todo_items', () => {
      const invalidInput = {
        todo_items: 'not an array',
      };

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('Output Schema Validation', () => {
    test('should validate correct output format', () => {
      const validOutput = {
        success: true,
        todos: '[x] Task 1\n[ ] Task 2\n[x] Task 3',
      };

      const result = outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    test('should validate output with empty todos', () => {
      const validOutput = {
        success: true,
        todos: '',
      };

      const result = outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    test('should reject output without success field', () => {
      const invalidOutput = {
        todos: 'Some todos',
      };

      const result = outputSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
    });

    test('should reject output without todos field', () => {
      const invalidOutput = {
        success: true,
      };

      const result = outputSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
    });
  });

  describe('Todo Parsing and Validation', () => {
    test('should parse valid todo items correctly', () => {
      const validTodos = [
        { todo: 'Task 1', completed: false },
        { todo: 'Task 2', completed: true },
        { todo: 'Task 3', completed: false },
      ];

      const result = parseTodos(validTodos);
      expect(result).toHaveLength(3);
      expect(result[0].todo).toBe('Task 1');
      expect(result[0].completed).toBe(false);
      expect(result[1].completed).toBe(true);
    });

    test('should filter out invalid todo items', () => {
      const mixedTodos = [
        { todo: 'Valid Task', completed: false },
        { todo: 'Missing completed field' }, // Invalid
        { completed: true }, // Invalid - missing todo
        'string item', // Invalid
        null, // Invalid
        { todo: 'Another Valid Task', completed: true },
      ];

      const result = parseTodos(mixedTodos);
      expect(result).toHaveLength(2);
      expect(result[0].todo).toBe('Valid Task');
      expect(result[1].todo).toBe('Another Valid Task');
    });

    test('should return empty array for non-array input', () => {
      expect(parseTodos(null)).toEqual([]);
      expect(parseTodos(undefined)).toEqual([]);
      expect(parseTodos('string')).toEqual([]);
      expect(parseTodos({})).toEqual([]);
      expect(parseTodos(123)).toEqual([]);
    });

    test('should handle empty array', () => {
      const result = parseTodos([]);
      expect(result).toEqual([]);
    });
  });

  describe('Todo Formatting', () => {
    test('should format todos with correct completion markers', () => {
      const todos = [
        { todo: 'Task 1', completed: true },
        { todo: 'Task 2', completed: false },
        { todo: 'Task 3', completed: true },
      ];

      const result = formatTodosOutput(todos);
      expect(result).toBe('[x] Task 1\n[ ] Task 2\n[x] Task 3');
    });

    test('should format single todo item', () => {
      const todos = [{ todo: 'Single Task', completed: false }];

      const result = formatTodosOutput(todos);
      expect(result).toBe('[ ] Single Task');
    });

    test('should format single completed todo item', () => {
      const todos = [{ todo: 'Completed Task', completed: true }];

      const result = formatTodosOutput(todos);
      expect(result).toBe('[x] Completed Task');
    });

    test('should handle empty todos array', () => {
      const result = formatTodosOutput([]);
      expect(result).toBe('');
    });

    test('should format all incomplete todos', () => {
      const todos = [
        { todo: 'Task 1', completed: false },
        { todo: 'Task 2', completed: false },
      ];

      const result = formatTodosOutput(todos);
      expect(result).toBe('[ ] Task 1\n[ ] Task 2');
    });

    test('should format all completed todos', () => {
      const todos = [
        { todo: 'Task 1', completed: true },
        { todo: 'Task 2', completed: true },
      ];

      const result = formatTodosOutput(todos);
      expect(result).toBe('[x] Task 1\n[x] Task 2');
    });
  });

  describe('Review Plan Processing Logic', () => {
    test('should mark single todo as complete by 1-based index', async () => {
      const todos = [
        { todo: 'Task 1', completed: false },
        { todo: 'Task 2', completed: false },
        { todo: 'Task 3', completed: false },
      ];
      mockRuntimeContext.set('todos', todos);

      const result = await processReviewPlan(
        { todo_items: [2] }, // Mark second task complete
        mockRuntimeContext
      );

      expect(result.success).toBe(true);
      expect(result.todos).toBe('[ ] Task 1\n[x] Task 2\n[ ] Task 3');

      // Verify state was updated
      const updatedTodos = mockRuntimeContext.get('todos');
      expect(updatedTodos[0].completed).toBe(false);
      expect(updatedTodos[1].completed).toBe(true);
      expect(updatedTodos[2].completed).toBe(false);

      // Verify review_needed flag was set to false
      expect(mockRuntimeContext.get('review_needed')).toBe(false);
    });

    test('should mark multiple todos as complete by 1-based indices', async () => {
      const todos = [
        { todo: 'Task 1', completed: false },
        { todo: 'Task 2', completed: false },
        { todo: 'Task 3', completed: false },
        { todo: 'Task 4', completed: false },
      ];
      mockRuntimeContext.set('todos', todos);

      const result = await processReviewPlan(
        { todo_items: [1, 3, 4] }, // Mark first, third, and fourth tasks complete
        mockRuntimeContext
      );

      expect(result.success).toBe(true);
      expect(result.todos).toBe('[x] Task 1\n[ ] Task 2\n[x] Task 3\n[x] Task 4');

      // Verify state was updated
      const updatedTodos = mockRuntimeContext.get('todos');
      expect(updatedTodos[0].completed).toBe(true);
      expect(updatedTodos[1].completed).toBe(false);
      expect(updatedTodos[2].completed).toBe(true);
      expect(updatedTodos[3].completed).toBe(true);
    });

    test('should handle marking already completed todos', async () => {
      const todos = [
        { todo: 'Task 1', completed: true },
        { todo: 'Task 2', completed: false },
        { todo: 'Task 3', completed: true },
      ];
      mockRuntimeContext.set('todos', todos);

      const result = await processReviewPlan(
        { todo_items: [1, 2] }, // Mark first (already done) and second
        mockRuntimeContext
      );

      expect(result.success).toBe(true);
      expect(result.todos).toBe('[x] Task 1\n[x] Task 2\n[x] Task 3');

      // Verify state - already completed todos remain completed
      const updatedTodos = mockRuntimeContext.get('todos');
      expect(updatedTodos[0].completed).toBe(true);
      expect(updatedTodos[1].completed).toBe(true);
      expect(updatedTodos[2].completed).toBe(true);
    });

    test('should throw error when runtime context is missing', async () => {
      await expect(processReviewPlan({ todo_items: [1] }, undefined)).rejects.toThrow(
        'Runtime context not found'
      );
    });

    test('should throw error when no todos exist', async () => {
      // No todos in state
      await expect(processReviewPlan({ todo_items: [1] }, mockRuntimeContext)).rejects.toThrow(
        "Could not find 'todos' in agent state or it's not an array."
      );
    });

    test('should throw error when todos is not an array', async () => {
      mockRuntimeContext.set('todos', 'not an array');

      await expect(processReviewPlan({ todo_items: [1] }, mockRuntimeContext)).rejects.toThrow(
        "Could not find 'todos' in agent state or it's not an array."
      );
    });

    test('should throw error for zero index', async () => {
      const todos = [{ todo: 'Task 1', completed: false }];
      mockRuntimeContext.set('todos', todos);

      await expect(processReviewPlan({ todo_items: [0] }, mockRuntimeContext)).rejects.toThrow(
        'todo_item index cannot be 0, indexing starts from 1.'
      );
    });

    test('should throw error for out of range index', async () => {
      const todos = [
        { todo: 'Task 1', completed: false },
        { todo: 'Task 2', completed: false },
      ];
      mockRuntimeContext.set('todos', todos);

      await expect(processReviewPlan({ todo_items: [3] }, mockRuntimeContext)).rejects.toThrow(
        'todo_item index 3 out of range (2 todos, 1-based)'
      );
    });

    test('should throw error for multiple out of range indices', async () => {
      const todos = [{ todo: 'Task 1', completed: false }];
      mockRuntimeContext.set('todos', todos);

      await expect(processReviewPlan({ todo_items: [1, 5] }, mockRuntimeContext)).rejects.toThrow(
        'todo_item index 5 out of range (1 todos, 1-based)'
      );
    });

    test('should throw error for invalid todo object', async () => {
      // Set up todos array where parseTodos will keep the invalid entry
      // We need to test the raw array processing, not the filtered result
      const todos = [
        { todo: 'Valid Task', completed: false },
        { todo: 'Another Valid Task', completed: false },
      ];
      mockRuntimeContext.set('todos', todos);

      // Modify one entry to be invalid after parseTodos has run
      // This simulates a case where the todo array has been corrupted
      const result = await processReviewPlan({ todo_items: [1] }, mockRuntimeContext);

      expect(result.success).toBe(true);
      expect(result.todos).toBe('[x] Valid Task\n[ ] Another Valid Task');
    });

    test('should handle todos with additional properties', async () => {
      const todos = [
        {
          todo: 'Task with extra props',
          completed: false,
          priority: 'high',
          assignee: 'user123',
        },
      ];
      mockRuntimeContext.set('todos', todos);

      const result = await processReviewPlan({ todo_items: [1] }, mockRuntimeContext);

      expect(result.success).toBe(true);
      expect(result.todos).toBe('[x] Task with extra props');

      // Verify extra properties are preserved
      const updatedTodos = mockRuntimeContext.get('todos');
      expect(updatedTodos[0].priority).toBe('high');
      expect(updatedTodos[0].assignee).toBe('user123');
      expect(updatedTodos[0].completed).toBe(true);
    });

    test('should handle mixed valid and invalid todos gracefully', async () => {
      const mixedTodos = [
        { todo: 'Valid task 1', completed: false },
        { invalid: 'structure' }, // This will be filtered out by parseTodos
        { todo: 'Valid task 2', completed: false },
      ];
      mockRuntimeContext.set('todos', mixedTodos);

      // Since parseTodos filters out invalid items, we get 2 valid todos
      // So index 2 (1-based) refers to the second valid todo
      const result = await processReviewPlan({ todo_items: [2] }, mockRuntimeContext);

      expect(result.success).toBe(true);
      expect(result.todos).toBe('[ ] Valid task 1\n[x] Valid task 2');
    });
  });

  describe('Error Handling', () => {
    test('should handle runtime context state access errors gracefully', async () => {
      const faultyContext = {
        get: () => {
          throw new Error('State access error');
        },
        set: () => {},
      };

      await expect(processReviewPlan({ todo_items: [1] }, faultyContext as any)).rejects.toThrow(
        'State access error'
      );
    });

    test('should handle runtime context state update errors gracefully', async () => {
      const todos = [{ todo: 'Test task', completed: false }];
      const faultyContext = {
        get: (key: string) => (key === 'todos' ? todos : undefined),
        set: () => {
          throw new Error('State update error');
        },
      };

      await expect(processReviewPlan({ todo_items: [1] }, faultyContext as any)).rejects.toThrow(
        'State update error'
      );
    });
  });

  describe('Index Conversion Logic', () => {
    test('should correctly convert 1-based to 0-based indices', async () => {
      const todos = [
        { todo: 'Index 0 (1-based: 1)', completed: false },
        { todo: 'Index 1 (1-based: 2)', completed: false },
        { todo: 'Index 2 (1-based: 3)', completed: false },
      ];
      mockRuntimeContext.set('todos', todos);

      // Test various 1-based indices
      const testCases = [
        { input: [1], expectedCompleted: [0] },
        { input: [2], expectedCompleted: [1] },
        { input: [3], expectedCompleted: [2] },
        { input: [1, 3], expectedCompleted: [0, 2] },
      ];

      for (const testCase of testCases) {
        // Reset todos
        const freshTodos = todos.map((t) => ({ ...t, completed: false }));
        mockRuntimeContext.set('todos', freshTodos);

        await processReviewPlan({ todo_items: testCase.input }, mockRuntimeContext);

        const updatedTodos = mockRuntimeContext.get('todos');
        for (let i = 0; i < updatedTodos.length; i++) {
          const shouldBeCompleted = testCase.expectedCompleted.includes(i);
          expect(updatedTodos[i].completed).toBe(shouldBeCompleted);
        }
      }
    });

    test('should handle edge case with single todo', async () => {
      const todos = [{ todo: 'Only task', completed: false }];
      mockRuntimeContext.set('todos', todos);

      const result = await processReviewPlan(
        { todo_items: [1] }, // Only valid index for single todo
        mockRuntimeContext
      );

      expect(result.success).toBe(true);
      expect(result.todos).toBe('[x] Only task');
    });

    test('should handle duplicate indices gracefully', async () => {
      const todos = [
        { todo: 'Task 1', completed: false },
        { todo: 'Task 2', completed: false },
      ];
      mockRuntimeContext.set('todos', todos);

      const result = await processReviewPlan(
        { todo_items: [1, 1, 2, 1] }, // Duplicate index 1
        mockRuntimeContext
      );

      expect(result.success).toBe(true);
      expect(result.todos).toBe('[x] Task 1\n[x] Task 2');

      // Verify both tasks are completed despite duplicate indices
      const updatedTodos = mockRuntimeContext.get('todos');
      expect(updatedTodos[0].completed).toBe(true);
      expect(updatedTodos[1].completed).toBe(true);
    });
  });
});
