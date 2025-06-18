import { beforeEach, describe, expect, test } from 'vitest';
import { z } from 'zod';

// Import the schemas we want to test (extracted from the tool file)
const inputSchema = z.object({
  final_response: z
    .string()
    .min(1, 'Final response is required')
    .describe(
      "The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

const outputSchema = z.object({
  success: z.boolean(),
  todos: z.string(),
});

// Define todo item interface for testing
interface TodoItem {
  todo: string;
  completed: boolean;
  [key: string]: unknown;
}

// Mock runtime context for testing
class MockRuntimeContext {
  private state: Map<string, unknown> = new Map();

  get(key: string): unknown | undefined {
    return this.state.get(key);
  }

  set(key: string, value: unknown): void {
    this.state.set(key, value);
  }

  clear(): void {
    this.state.clear();
  }
}

// Parse and validate todo items from agent state (copied from tool)
function parseTodos(todosValue: unknown): TodoItem[] {
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

// Format todos list for output with completion annotations (copied from tool)
function formatTodosOutput(todos: TodoItem[], markedByDone: number[]): string {
  return todos
    .map((todo, idx) => {
      const annotation = markedByDone.includes(idx)
        ? ' *Marked complete by calling the done tool'
        : '';
      return `[x] ${todo.todo}${annotation}`;
    })
    .join('\n');
}

// Process done tool execution with todo management (copied from tool)
async function processDone(
  params: { final_response: string },
  runtimeContext?: MockRuntimeContext
): Promise<{ success: boolean; todos: string }> {
  if (!runtimeContext) {
    throw new Error('Runtime context not found');
  }

  // Get the current todos from state
  const todosValue = runtimeContext.get('todos');
  const todos = parseTodos(todosValue);

  // If no todos exist, just return success without a list
  if (todos.length === 0) {
    return {
      success: true,
      todos: 'No to-do list found.',
    };
  }

  const markedByDone: number[] = []; // Track items marked by this tool

  // Mark all remaining unfinished todos as complete
  for (let idx = 0; idx < todos.length; idx++) {
    const todo = todos[idx];
    if (!todo.completed) {
      todo.completed = true;
      markedByDone.push(idx); // Track 0-based index
    }
  }

  // Save the updated todos back to state
  runtimeContext.set('todos', todos);

  // Format the output string, potentially noting items marked by 'done'
  const todosString = formatTodosOutput(todos, markedByDone);

  // This tool signals the end of the workflow and provides the final response.
  // The actual agent termination logic resides elsewhere.
  return {
    success: true,
    todos: todosString,
  };
}

describe('Done Tool Unit Tests', () => {
  let mockRuntimeContext: MockRuntimeContext;

  beforeEach(() => {
    mockRuntimeContext = new MockRuntimeContext();
  });

  describe('Input Schema Validation', () => {
    test('should validate correct input format', () => {
      const validInput = {
        final_response: 'Task completed successfully. All requirements have been met.',
      };

      const result = inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('should reject empty final_response', () => {
      const invalidInput = {
        final_response: '',
      };

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test('should reject missing final_response', () => {
      const invalidInput = {};

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test('should validate markdown formatted response', () => {
      const markdownInput = {
        final_response: `Task completed successfully.

- Created dashboard
- Generated reports
- Analyzed data

All requirements have been fulfilled.`,
      };

      const result = inputSchema.safeParse(markdownInput);
      expect(result.success).toBe(true);
    });
  });

  describe('Output Schema Validation', () => {
    test('should validate correct output format', () => {
      const validOutput = {
        success: true,
        todos: '[x] Task 1\n[x] Task 2 *Marked complete by calling the done tool',
      };

      const result = outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    test('should validate output with no todos message', () => {
      const validOutput = {
        success: true,
        todos: 'No to-do list found.',
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
    test('should format todos without any marked by done', () => {
      const todos = [
        { todo: 'Task 1', completed: true },
        { todo: 'Task 2', completed: true },
      ];
      const markedByDone: number[] = [];

      const result = formatTodosOutput(todos, markedByDone);
      expect(result).toBe('[x] Task 1\n[x] Task 2');
    });

    test('should format todos with some marked by done', () => {
      const todos = [
        { todo: 'Task 1', completed: true },
        { todo: 'Task 2', completed: true },
        { todo: 'Task 3', completed: true },
      ];
      const markedByDone = [1, 2]; // Tasks 2 and 3 marked by done

      const result = formatTodosOutput(todos, markedByDone);
      expect(result).toBe(
        '[x] Task 1\n' +
          '[x] Task 2 *Marked complete by calling the done tool\n' +
          '[x] Task 3 *Marked complete by calling the done tool'
      );
    });

    test('should format single todo item', () => {
      const todos = [{ todo: 'Single Task', completed: true }];
      const markedByDone = [0];

      const result = formatTodosOutput(todos, markedByDone);
      expect(result).toBe('[x] Single Task *Marked complete by calling the done tool');
    });

    test('should handle empty todos array', () => {
      const result = formatTodosOutput([], []);
      expect(result).toBe('');
    });
  });

  describe('Done Tool Processing Logic', () => {
    test('should handle no todos found case', async () => {
      // No todos in state
      const result = await processDone({ final_response: 'Task completed' }, mockRuntimeContext);

      expect(result.success).toBe(true);
      expect(result.todos).toBe('No to-do list found.');
    });

    test('should handle all todos already completed', async () => {
      const todos = [
        { todo: 'Task 1', completed: true },
        { todo: 'Task 2', completed: true },
      ];
      mockRuntimeContext.set('todos', todos);

      const result = await processDone({ final_response: 'All done' }, mockRuntimeContext);

      expect(result.success).toBe(true);
      expect(result.todos).toBe('[x] Task 1\n[x] Task 2');

      // Verify state wasn't modified (todos already completed)
      const updatedTodos = mockRuntimeContext.get('todos') as TodoItem[];
      expect(updatedTodos?.[0]?.completed).toBe(true);
      expect(updatedTodos?.[1]?.completed).toBe(true);
    });

    test('should mark incomplete todos as complete', async () => {
      const todos = [
        { todo: 'Task 1', completed: true },
        { todo: 'Task 2', completed: false },
        { todo: 'Task 3', completed: false },
      ];
      mockRuntimeContext.set('todos', todos);

      const result = await processDone({ final_response: 'Finishing up' }, mockRuntimeContext);

      expect(result.success).toBe(true);
      expect(result.todos).toBe(
        '[x] Task 1\n' +
          '[x] Task 2 *Marked complete by calling the done tool\n' +
          '[x] Task 3 *Marked complete by calling the done tool'
      );

      // Verify state was updated
      const updatedTodos = mockRuntimeContext.get('todos') as TodoItem[];
      expect(updatedTodos?.[0]?.completed).toBe(true);
      expect(updatedTodos?.[1]?.completed).toBe(true);
      expect(updatedTodos?.[2]?.completed).toBe(true);
    });

    test('should handle mixed todo completion states', async () => {
      const todos = [
        { todo: 'Already done', completed: true },
        { todo: 'Needs completion', completed: false },
        { todo: 'Also done', completed: true },
        { todo: 'Another incomplete', completed: false },
      ];
      mockRuntimeContext.set('todos', todos);

      const result = await processDone({ final_response: 'Workflow complete' }, mockRuntimeContext);

      expect(result.success).toBe(true);
      expect(result.todos).toBe(
        '[x] Already done\n' +
          '[x] Needs completion *Marked complete by calling the done tool\n' +
          '[x] Also done\n' +
          '[x] Another incomplete *Marked complete by calling the done tool'
      );

      // Verify only incomplete ones were updated
      const updatedTodos = mockRuntimeContext.get('todos') as TodoItem[];
      expect(updatedTodos?.every((todo: TodoItem) => todo.completed)).toBe(true);
    });

    test('should throw error when runtime context is missing', async () => {
      await expect(processDone({ final_response: 'Test' }, undefined)).rejects.toThrow(
        'Runtime context not found'
      );
    });

    test('should handle invalid todo data gracefully', async () => {
      // Set invalid todo data
      mockRuntimeContext.set('todos', [
        { todo: 'Valid task', completed: false },
        { invalid: 'data' }, // This will be filtered out
        null,
        'string item',
      ]);

      const result = await processDone({ final_response: 'Done' }, mockRuntimeContext);

      expect(result.success).toBe(true);
      expect(result.todos).toBe('[x] Valid task *Marked complete by calling the done tool');
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

      const result = await processDone({ final_response: 'Complete' }, mockRuntimeContext);

      expect(result.success).toBe(true);
      expect(result.todos).toBe(
        '[x] Task with extra props *Marked complete by calling the done tool'
      );

      // Verify extra properties are preserved
      const updatedTodos = mockRuntimeContext.get('todos') as TodoItem[];
      expect(updatedTodos?.[0]?.priority).toBe('high');
      expect(updatedTodos?.[0]?.assignee).toBe('user123');
      expect(updatedTodos?.[0]?.completed).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle runtime context errors gracefully', async () => {
      const faultyContext = {
        get: () => {
          throw new Error('State access error');
        },
        set: () => {},
      };

      await expect(
        processDone({ final_response: 'Test' }, faultyContext as MockRuntimeContext)
      ).rejects.toThrow('State access error');
    });
  });

  describe('Message Content Validation', () => {
    test('should accept various markdown formats', () => {
      const markdownFormats = [
        'Simple text response.',
        '- Bullet point list\n- Second item',
        '1. Numbered list\n2. Second item',
        '**Bold text** and *italic text*',
        'Text with `code` snippets',
        'Multiple\n\nParagraphs\n\nSupported',
      ];

      for (const format of markdownFormats) {
        const result = inputSchema.safeParse({ final_response: format });
        expect(result.success).toBe(true);
      }
    });

    test('should handle very long responses', () => {
      const longResponse = `${'A'.repeat(5000)} - Task completed successfully.`;
      const result = inputSchema.safeParse({ final_response: longResponse });
      expect(result.success).toBe(true);
    });
  });
});
