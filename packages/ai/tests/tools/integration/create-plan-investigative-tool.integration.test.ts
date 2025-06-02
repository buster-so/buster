import { createPlanInvestigativeTool } from '@/tools/planning-thinking-tools/create-plan-investigative-tool';
import { beforeEach, describe, expect, test } from 'vitest';

describe('Create Plan Investigative Tool Integration Tests', () => {
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
    expect(createPlanInvestigativeTool.id).toBe('create-plan-investigative');
    expect(createPlanInvestigativeTool.description).toBe('Use to create a plan for an analytical workflow.');
    expect(createPlanInvestigativeTool.inputSchema).toBeDefined();
    expect(createPlanInvestigativeTool.outputSchema).toBeDefined();
    expect(createPlanInvestigativeTool.execute).toBeDefined();
  });

  test('should validate tool input schema', () => {
    const validInput = {
      plan: 'Investigate customer turnover patterns to identify root causes'
    };

    const result = createPlanInvestigativeTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate tool output schema', () => {
    const validOutput = {
      success: true,
      todos: '[ ] Investigate data patterns\n[ ] Analyze correlations\n[ ] Test hypotheses'
    };

    const result = createPlanInvestigativeTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should handle runtime context requirements', async () => {
    const contextWithoutGet = {
      set: (key: string, value: any) => {}
    };

    const input = {
      plan: 'Investigate simple data patterns',
      runtimeContext: contextWithoutGet
    };

    // This should fail because get is missing
    await expect(createPlanInvestigativeTool.execute({ context: input }))
      .rejects.toThrow();
  });

  test('should process investigative plan and generate todos', async () => {
    const input = {
      plan: `
1. Investigate customer churn patterns in Q4 data
2. Analyze correlation between product usage and retention
3. Examine seasonal trends in user behavior
4. Test hypothesis about pricing impact on churn
5. Validate findings with statistical significance tests
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanInvestigativeTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Investigate customer churn patterns in Q4 data');
    expect(result.todos).toContain('[ ] Analyze correlation between product usage and retention');
    expect(result.todos).toContain('[ ] Examine seasonal trends in user behavior');
    expect(result.todos).toContain('[ ] Test hypothesis about pricing impact on churn');
    expect(result.todos).toContain('[ ] Validate findings with statistical significance tests');

    // Verify state was updated
    expect(mockRuntimeContext.get('plan_available')).toBe(true);
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos).toHaveLength(5);
    expect(savedTodos[0].todo).toBe('Investigate customer churn patterns in Q4 data');
    expect(savedTodos[0].completed).toBe(false);
  });

  test('should process complex investigative plan with markdown formatting', async () => {
    const input = {
      plan: `
**Thought**
Investigate why employee turnover has spiked in the engineering department. This requires deep analysis of multiple data sources to identify patterns and root causes.

**Step-by-Step Plan**
1. Create 11 Visualizations:
   - Investigate turnover rate trends over the last 12 months
   - Analyze turnover by department and team
   - Examine correlation between tenure and departure
   - Test satisfaction scores against turnover rates
   - Explore compensation data for patterns
   - Identify peak departure months and reasons
   - Query exit interview data for common themes
2. Validate hypotheses with statistical testing
3. Create comprehensive investigative dashboard
4. Review findings and develop retention recommendations

**Notes**
Focus on engineering teams specifically and use statistical significance testing for all correlations.
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanInvestigativeTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Create 11 Visualizations');
    expect(result.todos).toContain('[ ] Investigate turnover rate trends over the last 12 months');
    expect(result.todos).toContain('[ ] Analyze turnover by department and team');
    expect(result.todos).toContain('[ ] Test satisfaction scores against turnover rates');
    expect(result.todos).toContain('[ ] Explore compensation data for patterns');
    expect(result.todos).toContain('[ ] Validate hypotheses with statistical testing');

    // Verify state was updated correctly
    expect(mockRuntimeContext.get('plan_available')).toBe(true);
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos.length).toBeGreaterThan(0);
    expect(savedTodos.every((todo: any) => todo.completed === false)).toBe(true);
  });

  test('should handle bullet point format investigative plans', async () => {
    const input = {
      plan: `
Data Quality Investigation Project:

- Explore data completeness across all customer tables
- Investigate data accuracy issues in transaction records
- Analyze patterns in missing values and null entries
- Examine data consistency between different systems
- Test data validation rules currently in place
- Query historical data to identify degradation trends
- Discover root causes of data quality problems
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanInvestigativeTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Explore data completeness across all customer tables');
    expect(result.todos).toContain('[ ] Investigate data accuracy issues in transaction records');
    expect(result.todos).toContain('[ ] Analyze patterns in missing values and null entries');
    expect(result.todos).toContain('[ ] Examine data consistency between different systems');
    expect(result.todos).toContain('[ ] Test data validation rules currently in place');
    expect(result.todos).toContain('[ ] Query historical data to identify degradation trends');
    expect(result.todos).toContain('[ ] Discover root causes of data quality problems');

    // Verify proper state management
    expect(mockRuntimeContext.get('plan_available')).toBe(true);
  });

  test('should handle investigative action-oriented sentence format', async () => {
    const input = {
      plan: `
Explore customer segmentation patterns to understand behavioral differences.
Investigate correlation between customer lifetime value and engagement metrics.
Analyze seasonal variations in purchase behavior across different customer segments.
Test hypotheses about the impact of marketing campaigns on retention rates.
Query transaction data to identify high-value customer characteristics.
Examine user journey patterns that lead to successful conversions.
Validate findings using A/B testing data from previous campaigns.
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanInvestigativeTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Explore customer segmentation patterns to understand behavioral differences.');
    expect(result.todos).toContain('[ ] Investigate correlation between customer lifetime value and engagement metrics.');
    expect(result.todos).toContain('[ ] Analyze seasonal variations in purchase behavior across different customer segments.');
    expect(result.todos).toContain('[ ] Test hypotheses about the impact of marketing campaigns on retention rates.');
    expect(result.todos).toContain('[ ] Query transaction data to identify high-value customer characteristics.');

    // Verify all todos have correct structure
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos.every((todo: any) => 
      typeof todo.todo === 'string' && 
      typeof todo.completed === 'boolean'
    )).toBe(true);
  });

  test('should handle plan with no extractable investigative items', async () => {
    const input = {
      plan: `
This investigation aims to improve our understanding of customer behavior.
We want to make data-driven decisions about product development.
The analysis should be thorough and methodical.
Quality insights are important for business strategy.
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanInvestigativeTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toBe('[ ] Investigate the data to answer the key questions in the plan');

    // Verify fallback todo was created
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos).toHaveLength(1);
    expect(savedTodos[0].todo).toBe('Investigate the data to answer the key questions in the plan');
  });

  test('should limit todos to maximum of 15 items', async () => {
    // Create a plan with many investigative items
    const planItems = Array.from({ length: 25 }, (_, i) => `${i + 1}. Investigate data pattern ${i + 1} for comprehensive analysis`);
    const input = {
      plan: planItems.join('\n'),
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanInvestigativeTool.execute({ context: input });

    expect(result.success).toBe(true);

    // Count the number of todos
    const todoCount = (result.todos.match(/\[ \]/g) || []).length;
    expect(todoCount).toBeLessThanOrEqual(15);

    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos.length).toBeLessThanOrEqual(15);
  });

  test('should filter out very short and very long investigative todo items', async () => {
    const input = {
      plan: `
1. Do
2. Investigate comprehensive customer behavior patterns
3. Go
4. This is an extremely long investigative task description that goes on and on with way too much detail about data analysis methodologies and statistical testing procedures that should probably be broken down into smaller more manageable investigative pieces but instead is written as one enormous run-on sentence that exceeds reasonable length limits
5. Analyze user engagement metrics
6. Fix
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanInvestigativeTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Investigate comprehensive customer behavior patterns');
    expect(result.todos).toContain('[ ] Analyze user engagement metrics');
    expect(result.todos).not.toContain('Do');
    expect(result.todos).not.toContain('Go');
    expect(result.todos).not.toContain('Fix');
    expect(result.todos).not.toContain('extremely long investigative');
  });

  test('should handle mixed format investigative plan (numbered + bullets + action words)', async () => {
    const input = {
      plan: `
## Customer Behavior Investigation

1. Explore data sources
   - Investigate customer transaction database
   - Analyze user activity logs
2. Test behavioral hypotheses
Examine patterns in purchase timing
* Validate findings with control groups
Query additional customer feedback data
3. Statistical analysis
   - Test significance of findings
   Identify correlation coefficients
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanInvestigativeTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Explore data sources');
    expect(result.todos).toContain('[ ] Investigate customer transaction database');
    expect(result.todos).toContain('[ ] Analyze user activity logs');
    expect(result.todos).toContain('[ ] Test behavioral hypotheses');
    expect(result.todos).toContain('[ ] Examine patterns in purchase timing');
    expect(result.todos).toContain('[ ] Validate findings with control groups');

    // Verify state consistency
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos.length).toBeGreaterThan(0);
    expect(savedTodos.every((todo: any) => todo.hasOwnProperty('todo') && todo.hasOwnProperty('completed'))).toBe(true);
  });

  test('should handle investigative keywords in various contexts', async () => {
    const input = {
      plan: `
1. Explore potential data sources for customer analysis
2. Investigate anomalies in recent transaction patterns
3. Analyze customer segmentation using clustering methods
4. Test hypothesis about seasonal purchase behaviors
5. Query historical data for trend identification
6. Discover hidden patterns in user engagement data
7. Examine correlations between features and outcomes
8. Identify key drivers of customer satisfaction
9. Validate statistical significance of findings
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanInvestigativeTool.execute({ context: input });

    expect(result.success).toBe(true);
    
    // Verify all investigative keywords are captured
    expect(result.todos).toContain('[ ] Explore potential data sources for customer analysis');
    expect(result.todos).toContain('[ ] Investigate anomalies in recent transaction patterns');
    expect(result.todos).toContain('[ ] Analyze customer segmentation using clustering methods');
    expect(result.todos).toContain('[ ] Test hypothesis about seasonal purchase behaviors');
    expect(result.todos).toContain('[ ] Query historical data for trend identification');
    expect(result.todos).toContain('[ ] Discover hidden patterns in user engagement data');
    expect(result.todos).toContain('[ ] Examine correlations between features and outcomes');
    expect(result.todos).toContain('[ ] Identify key drivers of customer satisfaction');
    expect(result.todos).toContain('[ ] Validate statistical significance of findings');

    // Should have captured all 9 items
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos).toHaveLength(9);
  });

  test('should handle runtime context state access errors', async () => {
    const faultyContext = {
      get: () => { throw new Error('State access failed'); },
      set: () => {}
    };

    const input = {
      plan: '1. Investigate customer data',
      runtimeContext: faultyContext
    };

    await expect(createPlanInvestigativeTool.execute({ context: input }))
      .rejects.toThrow('State access failed');
  });

  test('should handle runtime context state update errors', async () => {
    const faultyContext = {
      get: () => undefined,
      set: () => { throw new Error('State update failed'); }
    };

    const input = {
      plan: '1. Investigate data patterns',
      runtimeContext: faultyContext
    };

    await expect(createPlanInvestigativeTool.execute({ context: input }))
      .rejects.toThrow('State update failed');
  });

  test('should preserve plan_available flag setting', async () => {
    const input = {
      plan: '1. Investigate customer behavior patterns',
      runtimeContext: mockRuntimeContext
    };

    // Initially should not be set
    expect(mockRuntimeContext.get('plan_available')).toBeUndefined();

    await createPlanInvestigativeTool.execute({ context: input });

    // Should be set to true after execution
    expect(mockRuntimeContext.get('plan_available')).toBe(true);
  });

  test('should handle various whitespace and formatting edge cases', async () => {
    const input = {
      plan: `

        1.    Investigate data patterns with extra spacing    

        2.	Analyze customer behavior	with tabs	

        3. Examine normal spacing patterns

        4.Query    multiple   spaces   between   words

      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanInvestigativeTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Investigate data patterns with extra spacing');
    expect(result.todos).toContain('[ ] Analyze customer behavior	with tabs');
    expect(result.todos).toContain('[ ] Examine normal spacing patterns');
    expect(result.todos).toContain('[ ] Query    multiple   spaces   between   words');
  });

  test('should validate input schema correctly', () => {
    // Test valid inputs
    const validInputs = [
      { plan: 'Investigate simple patterns' },
      { plan: 'Complex investigative plan:\n1. Explore data\n2. Analyze trends' },
      { plan: 'Plan with special characters: @#$%^&*()' }
    ];

    validInputs.forEach(input => {
      const result = createPlanInvestigativeTool.inputSchema.safeParse(input);
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
      const result = createPlanInvestigativeTool.inputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  test('should format output consistently', async () => {
    const input = {
      plan: `
1. Investigate first data pattern
2. Analyze second data source
3. Test third hypothesis
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanInvestigativeTool.execute({ context: input });

    expect(result.todos).toBe('[ ] Investigate first data pattern\n[ ] Analyze second data source\n[ ] Test third hypothesis');
    
    // Verify no extra whitespace or formatting issues
    expect(result.todos.startsWith('[ ]')).toBe(true);
    expect(result.todos.endsWith('hypothesis')).toBe(true);
    expect(result.todos.includes('\n[ ]')).toBe(true);
  });

  test('should handle todos with additional properties', async () => {
    const input = {
      plan: '1. Investigate customer satisfaction patterns',
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanInvestigativeTool.execute({ context: input });

    expect(result.success).toBe(true);
    
    // Verify saved todos have the expected structure
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos[0]).toEqual({
      todo: 'Investigate customer satisfaction patterns',
      completed: false
    });
    
    // Should allow additional properties if they exist
    expect(typeof savedTodos[0]).toBe('object');
    expect(savedTodos[0].todo).toBeDefined();
    expect(savedTodos[0].completed).toBeDefined();
  });

  test('should handle case-insensitive investigative action words', async () => {
    const input = {
      plan: `
INVESTIGATE customer churn patterns
Explore DATA quality issues
ANALYZE user behavior trends
test HYPOTHESIS about engagement
Query HISTORICAL records for insights
      `,
      runtimeContext: mockRuntimeContext
    };

    const result = await createPlanInvestigativeTool.execute({ context: input });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] INVESTIGATE customer churn patterns');
    expect(result.todos).toContain('[ ] Explore DATA quality issues');
    expect(result.todos).toContain('[ ] ANALYZE user behavior trends');
    expect(result.todos).toContain('[ ] test HYPOTHESIS about engagement');
    expect(result.todos).toContain('[ ] Query HISTORICAL records for insights');

    // All should be captured regardless of case
    const savedTodos = mockRuntimeContext.get('todos');
    expect(savedTodos).toHaveLength(5);
  });
});