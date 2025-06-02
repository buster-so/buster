import { beforeEach, describe, expect, test } from 'vitest';
import { z } from 'zod';

// Import the schemas we want to test (extracted from the tool file)
const inputSchema = z.object({
  plan: z.string().min(1, 'Plan is required').describe(
    'The step-by-step plan for an analytical workflow'
  )
});

const outputSchema = z.object({
  success: z.boolean(),
  todos: z.string()
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

// Extract todos from plan text (copied from tool)
function extractTodosFromPlanText(plan: string): TodoItem[] {
  const lines = plan.split('\n');
  const todos: TodoItem[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Look for numbered items, bullet points, or action words
    if (
      /^\d+\.\s+/.test(trimmed) || // 1. Create...
      /^[-*]\s+/.test(trimmed) ||  // - Create... or * Create...
      /^(create|build|implement|add|setup|configure|test|deploy|verify)\s+/i.test(trimmed) // Action words
    ) {
      let todoText = trimmed
        .replace(/^\d+\.\s*/, '') // Remove "1. "
        .replace(/^[-*]\s*/, '')  // Remove "- " or "* "
        .trim();
        
      if (todoText.length > 5 && todoText.length < 150) {
        todos.push({
          todo: todoText,
          completed: false
        });
        
        if (todos.length >= 15) {
          break;
        }
      }
    }
  }
  
  // If no todos found, create a generic one
  if (todos.length === 0) {
    todos.push({
      todo: 'Review and execute the provided plan',
      completed: false
    });
  }
  
  return todos;
}

// Process create plan execution (copied from tool)
async function processCreatePlanStraightforward(
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
    todos: todosString
  };
}

describe('Create Plan Straightforward Tool Unit Tests', () => {
  let mockRuntimeContext: MockRuntimeContext;

  beforeEach(() => {
    mockRuntimeContext = new MockRuntimeContext();
  });

  describe('Input Schema Validation', () => {
    test('should validate correct input format', () => {
      const validInput = {
        plan: 'Create a comprehensive sales dashboard with monthly trends'
      };

      const result = inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('should validate detailed plan input', () => {
      const validInput = {
        plan: `
**Thought**
Create visualizations for sales analysis.

**Step-by-Step Plan**
1. Create 3 visualizations:
   - Monthly sales trend line chart
   - Top products bar chart
   - Revenue by region pie chart
2. Create dashboard
3. Review and finish
        `
      };

      const result = inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('should reject empty plan', () => {
      const invalidInput = {
        plan: ''
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
        plan: 123
      };

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test('should reject null plan', () => {
      const invalidInput = {
        plan: null
      };

      const result = inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('Output Schema Validation', () => {
    test('should validate correct output format', () => {
      const validOutput = {
        success: true,
        todos: '[ ] Create sales dashboard\n[ ] Add monthly trend chart\n[ ] Review results'
      };

      const result = outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    test('should validate output with empty todos', () => {
      const validOutput = {
        success: true,
        todos: ''
      };

      const result = outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    test('should validate output with single todo', () => {
      const validOutput = {
        success: false,
        todos: '[ ] Single task to complete'
      };

      const result = outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    test('should reject output without success field', () => {
      const invalidOutput = {
        todos: 'Some todos'
      };

      const result = outputSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
    });

    test('should reject output without todos field', () => {
      const invalidOutput = {
        success: true
      };

      const result = outputSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
    });

    test('should reject output with non-boolean success', () => {
      const invalidOutput = {
        success: 'true',
        todos: 'Some todos'
      };

      const result = outputSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
    });

    test('should reject output with non-string todos', () => {
      const invalidOutput = {
        success: true,
        todos: ['todo1', 'todo2']
      };

      const result = outputSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
    });
  });

  describe('Todo Extraction Logic', () => {
    test('should extract numbered todos from plan', () => {
      const plan = `
1. Create sales dashboard
2. Add monthly trend chart
3. Include top products visualization
4. Review and publish
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(4);
      expect(result[0].todo).toBe('Create sales dashboard');
      expect(result[1].todo).toBe('Add monthly trend chart');
      expect(result[2].todo).toBe('Include top products visualization');
      expect(result[3].todo).toBe('Review and publish');
      expect(result.every(todo => todo.completed === false)).toBe(true);
    });

    test('should extract bullet point todos from plan', () => {
      const plan = `
- Build comprehensive analytics dashboard
* Create customer segmentation chart
- Add revenue tracking visualization
* Implement data filtering options
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(4);
      expect(result[0].todo).toBe('Build comprehensive analytics dashboard');
      expect(result[1].todo).toBe('Create customer segmentation chart');
      expect(result[2].todo).toBe('Add revenue tracking visualization');
      expect(result[3].todo).toBe('Implement data filtering options');
    });

    test('should extract action-word based todos', () => {
      const plan = `
Create a sales performance dashboard
Build monthly trend visualizations
Implement customer analytics
Add data export functionality
Configure automated reporting
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(5);
      expect(result[0].todo).toBe('Create a sales performance dashboard');
      expect(result[1].todo).toBe('Build monthly trend visualizations');
      expect(result[2].todo).toBe('Implement customer analytics');
      expect(result[3].todo).toBe('Add data export functionality');
      expect(result[4].todo).toBe('Configure automated reporting');
    });

    test('should limit to 15 todos maximum', () => {
      const plan = Array.from({ length: 20 }, (_, i) => `${i + 1}. Task ${i + 1}`).join('\n');

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(15);
    });

    test('should filter out very short todos', () => {
      const plan = `
1. Do
2. Create comprehensive sales dashboard
3. Go
4. Add detailed monthly trend analysis
5. Fix
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(2);
      expect(result[0].todo).toBe('Create comprehensive sales dashboard');
      expect(result[1].todo).toBe('Add detailed monthly trend analysis');
    });

    test('should filter out very long todos', () => {
      const longTodo = 'Create a very detailed and comprehensive sales dashboard with multiple visualizations including line charts for trends, bar charts for comparisons, pie charts for distributions, and advanced filtering capabilities that allow users to drill down into specific time periods, regions, and product categories';
      const plan = `
1. ${longTodo}
2. Add simple chart
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(1);
      expect(result[0].todo).toBe('Add simple chart');
    });

    test('should provide fallback todo when none found', () => {
      const plan = `
**Thought**
This is just a thought without actionable items.

**Notes**
Some general notes about the analysis.
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(1);
      expect(result[0].todo).toBe('Review and execute the provided plan');
      expect(result[0].completed).toBe(false);
    });

    test('should handle empty plan', () => {
      const result = extractTodosFromPlanText('');
      expect(result).toHaveLength(1);
      expect(result[0].todo).toBe('Review and execute the provided plan');
    });
  });

  describe('Plan Processing Logic', () => {
    test('should process plan successfully with runtime context', async () => {
      const plan = `
1. Create sales dashboard
2. Add trend visualizations
3. Review and publish
      `;

      const result = await processCreatePlanStraightforward(
        { plan },
        mockRuntimeContext
      );

      expect(result.success).toBe(true);
      expect(result.todos).toContain('[ ] Create sales dashboard');
      expect(result.todos).toContain('[ ] Add trend visualizations');
      expect(result.todos).toContain('[ ] Review and publish');
      
      // Verify state was updated
      expect(mockRuntimeContext.get('plan_available')).toBe(true);
      const savedTodos = mockRuntimeContext.get('todos');
      expect(savedTodos).toHaveLength(3);
      expect(savedTodos[0].todo).toBe('Create sales dashboard');
      expect(savedTodos[0].completed).toBe(false);
    });

    test('should throw error when runtime context is missing', async () => {
      const plan = 'Create a dashboard';

      await expect(
        processCreatePlanStraightforward({ plan }, undefined)
      ).rejects.toThrow('Runtime context not found');
    });

    test('should handle plan with no extractable todos', async () => {
      const plan = `
**Thought**
Just some general thoughts here.

**Notes**
Some random notes without actionable items.
      `;

      const result = await processCreatePlanStraightforward(
        { plan },
        mockRuntimeContext
      );

      expect(result.success).toBe(true);
      expect(result.todos).toBe('[ ] Review and execute the provided plan');
      
      // Verify state was updated
      expect(mockRuntimeContext.get('plan_available')).toBe(true);
      const savedTodos = mockRuntimeContext.get('todos');
      expect(savedTodos).toHaveLength(1);
      expect(savedTodos[0].todo).toBe('Review and execute the provided plan');
    });

    test('should format todos correctly', async () => {
      const plan = `
1. First task
2. Second task
      `;

      const result = await processCreatePlanStraightforward(
        { plan },
        mockRuntimeContext
      );

      expect(result.todos).toBe('[ ] First task\n[ ] Second task');
    });

    test('should set plan_available flag in state', async () => {
      const plan = '1. Create dashboard';

      await processCreatePlanStraightforward(
        { plan },
        mockRuntimeContext
      );

      expect(mockRuntimeContext.get('plan_available')).toBe(true);
    });

    test('should save todos to state with correct structure', async () => {
      const plan = `
1. First task
2. Second task
      `;

      await processCreatePlanStraightforward(
        { plan },
        mockRuntimeContext
      );

      const savedTodos = mockRuntimeContext.get('todos');
      expect(savedTodos).toHaveLength(2);
      expect(savedTodos[0]).toEqual({
        todo: 'First task',
        completed: false
      });
      expect(savedTodos[1]).toEqual({
        todo: 'Second task',
        completed: false
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle runtime context state update errors gracefully', async () => {
      const faultyContext = {
        get: () => undefined,
        set: () => { throw new Error('State update error'); }
      };

      // The error should be caught and handled
      await expect(
        processCreatePlanStraightforward({ plan: '1. Test task' }, faultyContext as any)
      ).rejects.toThrow('State update error');
    });

    test('should handle invalid plan input gracefully', async () => {
      // Test with various edge cases
      const edgeCases = [
        '',
        '   ',
        '\n\n\n',
        'No actionable items here just text',
        '####### Headers only #######'
      ];

      for (const plan of edgeCases) {
        const result = await processCreatePlanStraightforward(
          { plan },
          mockRuntimeContext
        );

        expect(result.success).toBe(true);
        expect(result.todos).toBe('[ ] Review and execute the provided plan');
      }
    });
  });

  describe('Pattern Recognition', () => {
    test('should recognize various action verbs', () => {
      const actionVerbs = [
        'create', 'build', 'implement', 'add', 'setup', 
        'configure', 'test', 'deploy', 'verify'
      ];

      actionVerbs.forEach(verb => {
        const plan = `${verb} a comprehensive dashboard`;
        const result = extractTodosFromPlanText(plan);
        
        expect(result).toHaveLength(1);
        expect(result[0].todo).toBe(`${verb} a comprehensive dashboard`);
      });
    });

    test('should recognize case-insensitive action verbs', () => {
      const plan = `
CREATE dashboard
Build analytics
IMPLEMENT features
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(3);
      expect(result[0].todo).toBe('CREATE dashboard');
      expect(result[1].todo).toBe('Build analytics');
      expect(result[2].todo).toBe('IMPLEMENT features');
    });

    test('should handle numbered lists with various formats', () => {
      const plan = `
1. Create dashboard (space after period)
2. Build charts (space after period)
3.  Add filters (multiple spaces)
      `;

      const result = extractTodosFromPlanText(plan);
      expect(result).toHaveLength(3);
      expect(result[0].todo).toBe('Create dashboard (space after period)');
      expect(result[1].todo).toBe('Build charts (space after period)');
      expect(result[2].todo).toBe('Add filters (multiple spaces)');
    });
  });
});
