import { createPlanStraightforwardTool } from '@/tools/planning-thinking-tools/create-plan-straightforward-tool';
import { beforeEach, describe, expect, test } from 'vitest';

describe('Create Plan Straightforward Tool Integration Tests', () => {
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
    expect(createPlanStraightforwardTool.id).toBe('create-plan-straightforward');
    expect(createPlanStraightforwardTool.description).toBe('Use to create a plan for an analytical workflow.');
    expect(createPlanStraightforwardTool.inputSchema).toBeDefined();
    expect(createPlanStraightforwardTool.outputSchema).toBeDefined();
    expect(createPlanStraightforwardTool.execute).toBeDefined();
  });

  test('should validate tool input schema', () => {
    const validInput = {
      plan: 'Create a comprehensive analytics dashboard with multiple visualizations'
    };

    const result = createPlanStraightforwardTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate tool output schema', () => {
    const validOutput = {
      success: true,
      todos: '[ ] Create dashboard\n[ ] Add visualizations\n[ ] Test functionality'
    };

    const result = createPlanStraightforwardTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should handle runtime context requirements', async () => {
    const contextWithoutGet = {
      set: (key: string, value: any) => {}
    };

    const input = {
      plan: 'Create a simple dashboard',
      runtimeContext: contextWithoutGet
    };

    // This should fail because get is missing
    await expect(createPlanStraightforwardTool.execute({ context: input }))
      .rejects.toThrow();
  });

  test('should process simple plan and generate todos', async () => {
    const input = {
      plan: `
1. Create sales dashboard
2. Add monthly trend visualization
3. Implement user filters
4. Review and publish
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanStraightforwardTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Create sales dashboard');
    expect(result.todos).toContain('[ ] Add monthly trend visualization');
    expect(result.todos).toContain('[ ] Implement user filters');
    expect(result.todos).toContain('[ ] Review and publish');

    // Verify state was updated
    expect(mockRuntimeContext.get('plan_available')).toBe(true);
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos).toHaveLength(4);
    expect(savedTodos[0].todo).toBe('Create sales dashboard');
    expect(savedTodos[0].completed).toBe(false);
  });

  test('should process complex plan with markdown formatting', async () => {
    const input = {
      plan: `
**Thought**
Create a comprehensive sales analysis dashboard with multiple visualizations to track key performance indicators.

**Step-by-Step Plan**
1. Create 3 visualizations:
   - Monthly sales trend line chart
   - Top 10 products bar chart
   - Revenue by region pie chart
2. Build dashboard layout with proper spacing
3. Add interactive filters for date ranges
4. Implement data export functionality
5. Test dashboard on different screen sizes
6. Review with stakeholders and gather feedback

**Notes**
Use last 12 months of data for trends and ensure all charts are responsive.
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanStraightforwardTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Create 3 visualizations');
    expect(result.todos).toContain('[ ] Monthly sales trend line chart');
    expect(result.todos).toContain('[ ] Build dashboard layout with proper spacing');
    expect(result.todos).toContain('[ ] Add interactive filters for date ranges');
    expect(result.todos).toContain('[ ] Test dashboard on different screen sizes');

    // Verify state was updated correctly
    expect(mockRuntimeContext.get('plan_available')).toBe(true);
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos.length).toBeGreaterThan(0);
    expect(savedTodos.every((todo: any) => todo.completed === false)).toBe(true);
  });

  test('should handle bullet point format plans', async () => {
    const input = {
      plan: `
Data Analytics Project Tasks:

- Query customer data from CRM system
- Create customer segmentation analysis
- Build interactive dashboard with filters
- Add drill-down capabilities for detailed views
- Implement automated reporting features
- Deploy dashboard to production environment
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanStraightforwardTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Query customer data from CRM system');
    expect(result.todos).toContain('[ ] Create customer segmentation analysis');
    expect(result.todos).toContain('[ ] Build interactive dashboard with filters');
    expect(result.todos).toContain('[ ] Deploy dashboard to production environment');

    // Verify proper state management
    expect(mockRuntimeContext.get('plan_available')).toBe(true);
  });

  test('should handle action-oriented sentence format', async () => {
    const input = {
      plan: `
Create comprehensive user analytics system for tracking engagement metrics.
Build real-time data processing pipeline using modern technologies.
Implement machine learning models for predictive user behavior analysis.
Setup monitoring and alerting systems for data quality issues.
Deploy solution to cloud infrastructure with auto-scaling capabilities.
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanStraightforwardTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Create comprehensive user analytics system for tracking engagement metrics.');
    expect(result.todos).toContain('[ ] Build real-time data processing pipeline using modern technologies.');
    expect(result.todos).toContain('[ ] Implement machine learning models for predictive user behavior analysis.');

    // Verify all todos have correct structure
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos.every((todo: any) => 
      typeof todo.todo === 'string' && 
      typeof todo.completed === 'boolean'
    )).toBe(true);
  });

  test('should handle plan with no extractable actionable items', async () => {
    const input = {
      plan: `
This project aims to improve overall business intelligence capabilities.
We want to enhance data-driven decision making across the organization.
The solution should be scalable and maintainable.
Quality and performance are important considerations.
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanStraightforwardTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe('[ ] Review and execute the provided plan');

    // Verify fallback todo was created
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos).toHaveLength(1);
    expect(savedTodos[0].todo).toBe('Review and execute the provided plan');
  });

  test('should limit todos to maximum of 15 items', async () => {
    // Create a plan with many items
    const planItems = Array.from({ length: 25 }, (_, i) => `${i + 1}. Task number ${i + 1} for comprehensive testing`);
    const input = {
      plan: planItems.join('\n'),
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanStraightforwardTool.execute({ context: input });

    expect(result.success).toBe(true);

    // Count the number of todos
    const todoCount = (result.todos.match(/\[ \]/g) || []).length;
    expect(todoCount).toBeLessThanOrEqual(15);

    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos.length).toBeLessThanOrEqual(15);
  });

  test('should filter out very short and very long todo items', async () => {
    const input = {
      plan: `
1. Do
2. Create comprehensive sales analytics dashboard
3. Go
4. This is an extremely long task description that goes on and on with way too much detail about implementation specifics and technical requirements that should probably be broken down into smaller more manageable pieces but instead is written as one enormous run-on sentence that exceeds reasonable length limits and should be filtered out
5. Add interactive filtering capabilities
6. Fix
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanStraightforwardTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Create comprehensive sales analytics dashboard');
    expect(result.todos).toContain('[ ] Add interactive filtering capabilities');
    expect(result.todos).not.toContain('Do');
    expect(result.todos).not.toContain('Go');
    expect(result.todos).not.toContain('Fix');
    expect(result.todos).not.toContain('extremely long task');
  });

  test('should handle mixed format plan (numbered + bullets + action words)', async () => {
    const input = {
      plan: `
## Analytics Project Plan

1. Setup data infrastructure
   - Configure database connections
   - Setup data pipelines
2. Build core analytics
Create visualization components
* Add user authentication
Implement role-based access controls
3. Testing and deployment
   - Test functionality
   Deploy to production
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanStraightforwardTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Setup data infrastructure');
    expect(result.todos).toContain('[ ] Configure database connections');
    expect(result.todos).toContain('[ ] Create visualization components');
    expect(result.todos).toContain('[ ] Add user authentication');
    expect(result.todos).toContain('[ ] Testing and deployment');

    // Verify state consistency
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos.length).toBeGreaterThan(0);
    expect(savedTodos.every((todo: any) => todo.hasOwnProperty('todo') && todo.hasOwnProperty('completed'))).toBe(true);
  });

  test('should handle runtime context state access errors', async () => {
    const faultyContext = {
      get: () => { throw new Error('State access failed'); },
      set: () => {}
    };

    const input = {
      plan: '1. Create dashboard',
      runtimeContext: faultyContext
    };

    await expect(createPlanStraightforwardTool.execute({ context: input }))
      .rejects.toThrow('State access failed');
  });

  test('should handle runtime context state update errors', async () => {
    const faultyContext = {
      get: () => undefined,
      set: () => { throw new Error('State update failed'); }
    };

    const input = {
      plan: '1. Create dashboard',
      runtimeContext: faultyContext
    };

    await expect(createPlanStraightforwardTool.execute({ context: input }))
      .rejects.toThrow('State update failed');
  });

  test('should preserve plan_available flag setting', async () => {
    const input = {
      plan: '1. Create analytics dashboard',
      runtimeContext: mockRuntimeContext
    };

    // Initially should not be set
    expect(mockRuntimeContext.get('plan_available')).toBeUndefined();

    await createPlanStraightforwardTool.execute({ context: input });

    // Should be set to true after execution
    expect(mockRuntimeContext.get('plan_available')).toBe(true);
  });

  test('should handle various whitespace and formatting edge cases', async () => {
    const input = {
      plan: `

        1.    Create dashboard with extra spacing    

        2.	Tab-separated content here	

        3. Normal spacing

        4.Multiple    spaces   in   between

      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanStraightforwardTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Create dashboard with extra spacing');
    expect(result.todos).toContain('[ ] Tab-separated content here');
    expect(result.todos).toContain('[ ] Normal spacing');
    expect(result.todos).toContain('[ ] Multiple    spaces   in   between');
  });

  test('should validate input schema correctly', () => {
    // Test valid inputs
    const validInputs = [
      { plan: 'Simple plan' },
      { plan: 'Complex plan with detailed steps:\n1. First step\n2. Second step' },
      { plan: 'Plan with special characters: @#$%^&*()' }
    ];

    validInputs.forEach(input => {
      const result = createPlanStraightforwardTool.inputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    // Test invalid inputs
    const invalidInputs = [
      {}, // Missing plan
      { plan: '' }, // Empty plan
      { plan: null }, // Null plan
      { plan: 123 }, // Non-string plan
      { plan: ['array', 'plan'] } // Array instead of string
    ];

    invalidInputs.forEach(input => {
      const result = createPlanStraightforwardTool.inputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  test('should format output consistently', async () => {
    const input = {
      plan: `
1. First task item
2. Second task item
3. Third task item
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanStraightforwardTool.execute({ context: input });

    expect(result.todos).toBe('[ ] First task item\n[ ] Second task item\n[ ] Third task item');
    
    // Verify no extra whitespace or formatting issues
    expect(result.todos.startsWith('[ ]')).toBe(true);
    expect(result.todos.endsWith('item')).toBe(true);
    expect(result.todos.includes('\n[ ]')).toBe(true);
  });

  test('should handle todos with additional properties', async () => {
    const input = {
      plan: '1. Create dashboard with proper functionality',
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanStraightforwardTool.execute({ context: input });

    expect(result.success).toBe(true);
    
    // Verify saved todos have the expected structure
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos[0]).toEqual({
      todo: 'Create dashboard with proper functionality',
      completed: false
    });
    
    // Should allow additional properties if they exist
    expect(typeof savedTodos[0]).toBe('object');
    expect(savedTodos[0].todo).toBeDefined();
    expect(savedTodos[0].completed).toBeDefined();
  });
});