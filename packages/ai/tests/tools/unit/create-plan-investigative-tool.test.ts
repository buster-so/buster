import { beforeEach, describe, expect, test } from 'vitest';
import { z } from 'zod';
import { validateArrayAccess } from '../../../src/utils/validation-helpers';

// Import the schemas we want to test (extracted from the tool file)
const inputSchema = z.object({
  plan: z
    .string()
    .min(1, 'Plan is required')
    .describe('The step-by-step investigative plan for analytical workflows using SQL'),
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

// Extract todos from plan text (copied from tool with investigative focus)
function extractTodosFromPlanText(plan: string): TodoItem[] {
  const lines = plan.split('\n');
  const todos: TodoItem[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Look for numbered items, bullet points, or investigative action words
    if (
      /^\d+\.\s+/.test(trimmed) || // 1. Create...
      /^[-*]\s+/.test(trimmed) || // - Create... or * Create...
      /^(explore|investigate|analyze|test|query|discover|examine|identify|validate)\s+/i.test(
        trimmed
      ) // Investigative action words
    ) {
      const todoText = trimmed
        .replace(/^\d+\.\s*/, '') // Remove "1. "
        .replace(/^[-*]\s*/, '') // Remove "- " or "* "
        .trim();

      if (todoText.length > 5 && todoText.length < 150) {
        todos.push({
          todo: todoText,
          completed: false,
        });

        if (todos.length >= 15) {
          break;
        }
      }
    }
  }

  // If no todos found, create a generic investigative one
  if (todos.length === 0) {
    todos.push({
      todo: 'Investigate the data to answer the key questions in the plan',
      completed: false,
    });
  }

  return todos;
}

// Process create plan execution (copied from tool)
async function processCreatePlanInvestigative(
  params: { plan: string },
  runtimeContext?: MockRuntimeContext
): Promise<{ success: boolean; todos: string }> {
  if (!runtimeContext) {
    throw new Error('Runtime context not found');
  }

  // Set plan_available to true in agent state
  runtimeContext.set('plan_available', true);

  let todosString = '';

  try {
    // Use fallback extraction since we can't mock LLM in unit tests
    const todosStateObjects = extractTodosFromPlanText(params.plan);

    // Format todos as "[ ] {todo}" strings
    const formattedTodos = todosStateObjects
      .filter((item) => item.todo && typeof item.todo === 'string')
      .map((item) => `[ ] ${item.todo}`);

    todosString = formattedTodos.join('\n');

    // Save todos to agent state
    runtimeContext.set('todos', todosStateObjects);
  } catch (error) {
    console.warn(
      `Failed to generate todos from plan using LLM: ${error instanceof Error ? error.message : String(error)}. Proceeding without todos.`
    );

    // Set empty todos array on error
    runtimeContext.set('todos', []);
  }

  return {
    success: true,
    todos: todosString,
  };
}

describe('Create Plan Investigative Tool Unit Tests', () => {
  let mockRuntimeContext: MockRuntimeContext;

  beforeEach(() => {
    mockRuntimeContext = new MockRuntimeContext();
  });

  describe('Input Schema Validation', () => {
    test('should validate correct input format', () => {
      const validInput = {
        plan: 'Investigate customer turnover patterns using data analysis',
      };

      const result = inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('should validate detailed investigative plan input', () => {
      const validInput = {
        plan: `
**Thought**
Investigate why customer churn has increased in Q4.

**Step-by-Step Plan**
1. Analyze customer behavior data from last 6 months
2. Examine correlation between pricing changes and churn
3. Investigate customer feedback patterns
4. Create visualizations to identify trends

**Notes**
Focus on high-value customer segments.
        `,
      };

      const result = inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('should reject empty plan', () => {
      const invalidInput = {
        plan: '',
      };

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test('should reject missing plan field', () => {
      const invalidInput = {};

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test('should reject non-string plan', () => {
      const invalidInput = {
        plan: 123,
      };

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test('should reject null plan', () => {
      const invalidInput = {
        plan: null,
      };

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('Output Schema Validation', () => {
    test('should validate correct output format', () => {
      const validOutput = {
        success: true,
        todos:
          '[ ] Investigate data patterns\n[ ] Analyze customer behavior\n[ ] Examine correlations',
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

    test('should validate output with single todo', () => {
      const validOutput = {
        success: false,
        todos: '[ ] Single investigative task',
      };

      const result = outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    test('should reject output without success field', () => {
      const invalidOutput = {
        todos: 'Some investigative todos',
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

    test('should reject output with non-boolean success', () => {
      const invalidOutput = {
        success: 'true',
        todos: 'Some todos',
      };

      const result = outputSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
    });

    test('should reject output with non-string todos', () => {
      const invalidOutput = {
        success: true,
        todos: ['todo1', 'todo2'],
      };

      const result = outputSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
    });
  });

  describe('Todo Extraction Logic', () => {
    test('should extract numbered investigative todos from plan', () => {
      const plan = `
1. Investigate customer churn patterns
2. Analyze revenue impact by segment
3. Examine correlation with product usage
4. Validate findings with statistical tests
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(4);
      const todo0 = validateArrayAccess(result, 0, 'todo extraction');
      const todo1 = validateArrayAccess(result, 1, 'todo extraction');
      const todo2 = validateArrayAccess(result, 2, 'todo extraction');
      const todo3 = validateArrayAccess(result, 3, 'todo extraction');
      expect(todo0.todo).toBe('Investigate customer churn patterns');
      expect(todo1.todo).toBe('Analyze revenue impact by segment');
      expect(todo2.todo).toBe('Examine correlation with product usage');
      expect(todo3.todo).toBe('Validate findings with statistical tests');
      expect(result.every((todo) => todo.completed === false)).toBe(true);
    });

    test('should extract bullet point investigative todos from plan', () => {
      const plan = `
- Explore data quality issues in customer database
* Investigate patterns in user behavior logs
- Analyze seasonal trends in sales data
* Examine outliers in transaction records
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(4);
      const todo0 = validateArrayAccess(result, 0, 'bullet point todos');
      const todo1 = validateArrayAccess(result, 1, 'bullet point todos');
      const todo2 = validateArrayAccess(result, 2, 'bullet point todos');
      const todo3 = validateArrayAccess(result, 3, 'bullet point todos');
      expect(todo0.todo).toBe('Explore data quality issues in customer database');
      expect(todo1.todo).toBe('Investigate patterns in user behavior logs');
      expect(todo2.todo).toBe('Analyze seasonal trends in sales data');
      expect(todo3.todo).toBe('Examine outliers in transaction records');
    });

    test('should extract investigative action-word based todos', () => {
      const plan = `
Explore customer segmentation opportunities
Investigate data anomalies in recent transactions
Analyze correlation between marketing campaigns and sales
Test hypothesis about user engagement patterns
Query historical data for trend analysis
Discover patterns in customer support interactions
Examine relationship between pricing and retention
Identify root causes of performance issues
Validate assumptions using statistical methods
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(9);
      const todo0 = validateArrayAccess(result, 0, 'action word todos');
      const todo1 = validateArrayAccess(result, 1, 'action word todos');
      const todo2 = validateArrayAccess(result, 2, 'action word todos');
      const todo3 = validateArrayAccess(result, 3, 'action word todos');
      const todo4 = validateArrayAccess(result, 4, 'action word todos');
      expect(todo0.todo).toBe('Explore customer segmentation opportunities');
      expect(todo1.todo).toBe('Investigate data anomalies in recent transactions');
      expect(todo2.todo).toBe('Analyze correlation between marketing campaigns and sales');
      expect(todo3.todo).toBe('Test hypothesis about user engagement patterns');
      expect(todo4.todo).toBe('Query historical data for trend analysis');
    });

    test('should handle mixed investigative todo formats', () => {
      const plan = `
**Investigation Plan**
1. Explore data sources
   - Investigate customer database
   - Analyze transaction logs
2. Test hypotheses
Examine patterns in user behavior
* Validate findings with control groups
Query additional data sources for confirmation
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((todo) => todo.todo.includes('Explore data sources'))).toBe(true);
      expect(result.some((todo) => todo.todo.includes('Investigate customer database'))).toBe(true);
      expect(result.some((todo) => todo.todo.includes('Test hypotheses'))).toBe(true);
      expect(result.some((todo) => todo.todo.includes('Examine patterns in user behavior'))).toBe(
        true
      );
    });

    test('should limit to 15 todos maximum', () => {
      const plan = Array.from(
        { length: 20 },
        (_, i) => `${i + 1}. Investigate aspect ${i + 1}`
      ).join('\n');

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(15);
    });

    test('should filter out very short todos', () => {
      const plan = `
1. Do
2. Investigate comprehensive customer behavior patterns
3. Go
4. Analyze detailed quarterly revenue trends
5. Fix
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(2);
      const todo0 = validateArrayAccess(result, 0, 'filtered todos');
      const todo1 = validateArrayAccess(result, 1, 'filtered todos');
      expect(todo0.todo).toBe('Investigate comprehensive customer behavior patterns');
      expect(todo1.todo).toBe('Analyze detailed quarterly revenue trends');
    });

    test('should filter out very long todos', () => {
      const longTodo =
        'Investigate a very detailed and comprehensive customer behavior analysis with multiple data sources including transaction logs, user activity tracking, customer service interactions, and social media engagement patterns across different time periods and customer segments while considering seasonal variations and external market factors';
      const plan = `
1. ${longTodo}
2. Analyze simple metrics
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(1);
      const todo0 = validateArrayAccess(result, 0, 'long todo filter');
      expect(todo0.todo).toBe('Analyze simple metrics');
    });

    test('should provide fallback investigative todo when none found', () => {
      const plan = `
**Thought**
We need to understand the business better.

**Notes**
Data quality is important for analysis.
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(1);
      const todo0 = validateArrayAccess(result, 0, 'fallback todo');
      expect(todo0.todo).toBe('Investigate the data to answer the key questions in the plan');
      expect(todo0.completed).toBe(false);
    });

    test('should handle empty plan', () => {
      const result = extractTodosFromPlanText('');
      expect(result).toHaveLength(1);
      const todo0 = validateArrayAccess(result, 0, 'empty plan todo');
      expect(todo0.todo).toBe('Investigate the data to answer the key questions in the plan');
    });

    test('should preserve todo structure with additional fields', () => {
      const plan = '1. Investigate customer patterns';
      const result = extractTodosFromPlanText(plan);

      const todo0 = validateArrayAccess(result, 0, 'preserved todo');
      expect(todo0).toEqual({
        todo: 'Investigate customer patterns',
        completed: false,
      });
    });
  });

  describe('Plan Processing Logic', () => {
    test('should process investigative plan successfully with runtime context', async () => {
      const plan = `
1. Investigate customer churn drivers
2. Analyze revenue impact patterns
3. Examine data quality issues
4. Validate hypotheses with testing
      `;

      const result = await processCreatePlanInvestigative({ plan }, mockRuntimeContext);

      expect(result.success).toBe(true);
      expect(result.todos).toContain('[ ] Investigate customer churn drivers');
      expect(result.todos).toContain('[ ] Analyze revenue impact patterns');
      expect(result.todos).toContain('[ ] Examine data quality issues');
      expect(result.todos).toContain('[ ] Validate hypotheses with testing');

      // Verify state was updated
      expect(mockRuntimeContext.get('plan_available')).toBe(true);
      const savedTodos = mockRuntimeContext.get('todos');
      expect(savedTodos).toHaveLength(4);
      const savedTodoItem0 = validateArrayAccess(savedTodos as TodoItem[], 0, 'saved todos');
      expect(savedTodoItem0.todo).toBe('Investigate customer churn drivers');
      expect(savedTodoItem0.completed).toBe(false);
    });

    test('should throw error when runtime context is missing', async () => {
      const plan = 'Investigate customer behavior';

      await expect(processCreatePlanInvestigative({ plan }, undefined)).rejects.toThrow(
        'Runtime context not found'
      );
    });

    test('should handle plan with no extractable investigative todos', async () => {
      const plan = `
**Thought**
Just some general thoughts about data.

**Notes**
Quality analysis is important but no specific actions.
      `;

      const result = await processCreatePlanInvestigative({ plan }, mockRuntimeContext);

      expect(result.success).toBe(true);
      expect(result.todos).toBe('[ ] Investigate the data to answer the key questions in the plan');

      // Verify state was updated
      expect(mockRuntimeContext.get('plan_available')).toBe(true);
      const savedTodos = mockRuntimeContext.get('todos');
      expect(savedTodos).toHaveLength(1);
      const savedTodoItem0 = validateArrayAccess(
        savedTodos as TodoItem[],
        0,
        'fallback saved todos'
      );
      expect(savedTodoItem0.todo).toBe(
        'Investigate the data to answer the key questions in the plan'
      );
    });

    test('should format investigative todos correctly', async () => {
      const plan = `
1. Explore data patterns
2. Investigate anomalies
      `;

      const result = await processCreatePlanInvestigative({ plan }, mockRuntimeContext);

      expect(result.todos).toBe('[ ] Explore data patterns\n[ ] Investigate anomalies');
    });

    test('should handle complex investigative plan with markdown', async () => {
      const plan = `
**Thought**
Investigate why sales have declined in Q4.

**Step-by-Step Plan**
1. Analyze 11 visualizations:
   - Explore sales trends over time
   - Investigate customer segment changes
   - Examine product performance variations
2. Test hypotheses about market factors
3. Validate findings with additional data

**Notes**
Focus on statistical significance of findings.
      `;

      const result = await processCreatePlanInvestigative({ plan }, mockRuntimeContext);

      expect(result.success).toBe(true);
      expect(result.todos).toContain('[ ] Analyze 11 visualizations');
      expect(result.todos).toContain('[ ] Explore sales trends over time');
      expect(result.todos).toContain('[ ] Test hypotheses about market factors');
      expect(result.todos).toContain('[ ] Validate findings with additional data');
    });

    test('should set plan_available flag in state', async () => {
      const plan = '1. Investigate data quality';

      await processCreatePlanInvestigative({ plan }, mockRuntimeContext);

      expect(mockRuntimeContext.get('plan_available')).toBe(true);
    });

    test('should save investigative todos to state with correct structure', async () => {
      const plan = `
1. Explore customer data
2. Investigate behavior patterns
      `;

      await processCreatePlanInvestigative({ plan }, mockRuntimeContext);

      const savedTodos = mockRuntimeContext.get('todos');
      expect(savedTodos).toHaveLength(2);
      const savedTodoItem0 = validateArrayAccess(
        savedTodos as TodoItem[],
        0,
        'saved todo structure'
      );
      const savedTodoItem1 = validateArrayAccess(
        savedTodos as TodoItem[],
        1,
        'saved todo structure'
      );
      expect(savedTodoItem0).toEqual({
        todo: 'Explore customer data',
        completed: false,
      });
      expect(savedTodoItem1).toEqual({
        todo: 'Investigate behavior patterns',
        completed: false,
      });
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

      // The error should be caught and handled within the function
      const result = await processCreatePlanInvestigative(
        { plan: '1. Test investigation task' },
        faultyContext as unknown as MockRuntimeContext
      );

      expect(result.success).toBe(true);
    });

    test('should handle runtime context state update errors gracefully', async () => {
      const faultyContext = {
        get: () => undefined,
        set: () => {
          throw new Error('State update error');
        },
      };

      // The error should be caught and handled
      await expect(
        processCreatePlanInvestigative(
          { plan: '1. Test task' },
          faultyContext as unknown as MockRuntimeContext
        )
      ).rejects.toThrow('State update error');
    });

    test('should handle invalid plan input gracefully', async () => {
      // Test with various edge cases
      const edgeCases = [
        '',
        '   ',
        '\n\n\n',
        'No actionable investigative items here',
        '####### Headers only #######',
      ];

      for (const plan of edgeCases) {
        const result = await processCreatePlanInvestigative({ plan }, mockRuntimeContext);

        expect(result.success).toBe(true);
        expect(result.todos).toBe(
          '[ ] Investigate the data to answer the key questions in the plan'
        );
      }
    });
  });

  describe('Investigative Pattern Recognition', () => {
    test('should recognize various investigative action verbs', () => {
      const actionVerbs = [
        'explore',
        'investigate',
        'analyze',
        'test',
        'query',
        'discover',
        'examine',
        'identify',
        'validate',
      ];

      for (const verb of actionVerbs) {
        const plan = `${verb} customer behavior patterns`;
        const result = extractTodosFromPlanText(plan);

        expect(result).toHaveLength(1);
        const todo0 = validateArrayAccess(result, 0, 'verb recognition');
        expect(todo0.todo).toBe(`${verb} customer behavior patterns`);
      }
    });

    test('should recognize case-insensitive investigative action verbs', () => {
      const plan = `
EXPLORE data patterns
Investigate user trends
ANALYZE revenue streams
Test statistical models
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(4);
      const todo0 = validateArrayAccess(result, 0, 'case insensitive todos');
      const todo1 = validateArrayAccess(result, 1, 'case insensitive todos');
      const todo2 = validateArrayAccess(result, 2, 'case insensitive todos');
      const todo3 = validateArrayAccess(result, 3, 'case insensitive todos');
      expect(todo0.todo).toBe('EXPLORE data patterns');
      expect(todo1.todo).toBe('Investigate user trends');
      expect(todo2.todo).toBe('ANALYZE revenue streams');
      expect(todo3.todo).toBe('Test statistical models');
    });

    test('should handle numbered lists with various formats', () => {
      const plan = `
1. Investigate data anomalies (space after period)
2. Analyze customer segments (space after period)
3.  Examine correlation patterns (multiple spaces)
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(3);
      const todo0 = validateArrayAccess(result, 0, 'numbered list formats');
      const todo1 = validateArrayAccess(result, 1, 'numbered list formats');
      const todo2 = validateArrayAccess(result, 2, 'numbered list formats');
      expect(todo0.todo).toBe('Investigate data anomalies (space after period)');
      expect(todo1.todo).toBe('Analyze customer segments (space after period)');
      expect(todo2.todo).toBe('Examine correlation patterns (multiple spaces)');
    });

    test('should handle bullet points with various formats', () => {
      const plan = `
- Explore database structures (space after dash)
- Investigate data quality (space after dash)
-  Analyze missing values (multiple spaces)
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(3);
      const todo0 = validateArrayAccess(result, 0, 'bullet point formats');
      const todo1 = validateArrayAccess(result, 1, 'bullet point formats');
      const todo2 = validateArrayAccess(result, 2, 'bullet point formats');
      expect(todo0.todo).toBe('Explore database structures (space after dash)');
      expect(todo1.todo).toBe('Investigate data quality (space after dash)');
      expect(todo2.todo).toBe('Analyze missing values (multiple spaces)');
    });

    test('should prioritize investigative terms over general action words', () => {
      const plan = `
Create dashboard
Investigate data patterns
Build visualization
Explore user behavior
Add filtering options
      `;

      const result = extractTodosFromPlanText(plan);
      // Should include both investigative and general action words
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((todo) => todo.todo.includes('Investigate data patterns'))).toBe(true);
      expect(result.some((todo) => todo.todo.includes('Explore user behavior'))).toBe(true);
    });
  });
});
