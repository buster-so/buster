import { createPlanStraightforwardTool } from '@/tools/planning-thinking-tools/create-plan-straightforward-tool';
import { generateText } from 'ai';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the AI SDK
vi.mock('ai', async () => {
  return {
    generateText: vi.fn(),
  };
});

vi.mock('@ai-sdk/openai', async () => {
  return {
    openai: vi.fn(() => 'mocked-model'),
  };
});

describe('Create Plan Straightforward Tool Unit Tests', () => {
  const mockGenerateText = vi.mocked(generateText);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should have correct configuration', () => {
    expect(createPlanStraightforwardTool.id).toBe('create-plan-straightforward');
    expect(createPlanStraightforwardTool.description).toBe(
      'Create a clear and actionable plan for analytical workflows'
    );
    expect(createPlanStraightforwardTool.inputSchema).toBeDefined();
    expect(createPlanStraightforwardTool.outputSchema).toBeDefined();
    expect(createPlanStraightforwardTool.execute).toBeDefined();
  });

  test('should validate input schema', () => {
    const validInput = {
      plan: 'Create a dashboard with user metrics',
    };
    const result = createPlanStraightforwardTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate output schema structure', () => {
    const validOutput = {
      success: true,
      todos:
        '[ ] Create user metrics dashboard\n[ ] Add filters for date range\n[ ] Test dashboard functionality',
    };

    const result = createPlanStraightforwardTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should generate todos from plan using LLM', async () => {
    const mockResponse = {
      text: JSON.stringify({
        todos: [
          'Query user data from database',
          'Create bar chart for user metrics',
          'Add date filters to dashboard',
          'Test dashboard functionality',
        ],
      }),
      reasoning: '',
      files: [],
      reasoningDetails: null,
      sources: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      experimental_providerMetadata: {},
      rawResponse: undefined,
      request: {},
      response: {},
      logprobs: undefined,
      finishReason: 'stop' as const,
      warnings: undefined,
      responseMessages: [],
    };

    mockGenerateText.mockResolvedValueOnce(mockResponse);

    const result = await createPlanStraightforwardTool.execute({
      context: {
        plan: 'Create a dashboard showing user metrics with charts and filters',
      },
    });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Query user data from database');
    expect(result.todos).toContain('[ ] Create bar chart for user metrics');
    expect(result.todos).toContain('[ ] Add date filters to dashboard');
    expect(result.todos).toContain('[ ] Test dashboard functionality');

    expect(mockGenerateText).toHaveBeenCalled();
  });

  test('should handle LLM failure gracefully and use fallback', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('LLM service unavailable'));

    const plan = `
1. Create user analytics dashboard
2. Add visualizations for key metrics
3. Implement filtering capabilities
4. Test and validate results
`;

    const result = await createPlanStraightforwardTool.execute({
      context: { plan },
    });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Create user analytics dashboard');
    expect(result.todos).toContain('[ ] Add visualizations for key metrics');
    expect(result.todos).toContain('[ ] Implement filtering capabilities');
    expect(result.todos).toContain('[ ] Test and validate results');
  });

  test('should handle invalid LLM response format', async () => {
    const mockResponse = {
      text: 'Invalid JSON response',
    };

    mockGenerateText.mockResolvedValueOnce(mockResponse);

    const plan = `
- Build metrics dashboard
- Configure data sources
- Create visualizations
`;

    const result = await createPlanStraightforwardTool.execute({
      context: { plan },
    });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Build metrics dashboard');
    expect(result.todos).toContain('[ ] Configure data sources');
    expect(result.todos).toContain('[ ] Create visualizations');
  });

  test('should extract todos from numbered list format', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('LLM unavailable'));

    const plan = `
## Implementation Plan

1. Set up database connections
2. Create data models for users
3. Build REST API endpoints
4. Implement authentication middleware
5. Create frontend components
6. Add error handling
7. Write unit tests
8. Deploy to staging environment
`;

    const result = await createPlanStraightforwardTool.execute({
      context: { plan },
    });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Set up database connections');
    expect(result.todos).toContain('[ ] Create data models for users');
    expect(result.todos).toContain('[ ] Build REST API endpoints');
    expect(result.todos).toContain('[ ] Write unit tests');
  });

  test('should extract todos from bullet point format', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('LLM unavailable'));

    const plan = `
Dashboard Development Tasks:

- Query customer data from CRM
- Design dashboard layout wireframes  
- Create sales performance charts
- Add interactive filters for date ranges
- Implement export functionality
- Test dashboard on different devices
- Deploy dashboard to production
`;

    const result = await createPlanStraightforwardTool.execute({
      context: { plan },
    });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Query customer data from CRM');
    expect(result.todos).toContain('[ ] Design dashboard layout wireframes');
    expect(result.todos).toContain('[ ] Create sales performance charts');
    expect(result.todos).toContain('[ ] Deploy dashboard to production');
  });

  test('should extract todos from action-oriented sentences', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('LLM unavailable'));

    const plan = `
Create a comprehensive user analytics system.
Build data pipelines for real-time processing.
Implement machine learning models for predictions.
Setup monitoring and alerting systems.
Deploy the solution to cloud infrastructure.
Test the system with production data.
`;

    const result = await createPlanStraightforwardTool.execute({
      context: { plan },
    });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Create a comprehensive user analytics system.');
    expect(result.todos).toContain('[ ] Build data pipelines for real-time processing.');
    expect(result.todos).toContain('[ ] Implement machine learning models for predictions.');
  });

  test('should handle empty plan input', async () => {
    await expect(
      createPlanStraightforwardTool.execute({
        context: { plan: '' },
      })
    ).rejects.toThrow('Plan cannot be empty');
  });

  test('should handle whitespace-only plan input', async () => {
    await expect(
      createPlanStraightforwardTool.execute({
        context: { plan: '   \n\t   ' },
      })
    ).rejects.toThrow('Plan cannot be empty');
  });

  test('should limit todos to maximum of 15 items', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('LLM unavailable'));

    // Create a plan with more than 15 numbered items
    const planItems = Array.from({ length: 20 }, (_, i) => `${i + 1}. Task number ${i + 1}`);
    const plan = planItems.join('\n');

    const result = await createPlanStraightforwardTool.execute({
      context: { plan },
    });

    expect(result.success).toBe(true);

    // Count the number of todos (each starts with "[ ]")
    const todoCount = (result.todos.match(/\[ \]/g) || []).length;
    expect(todoCount).toBeLessThanOrEqual(15);
  });

  test('should filter out very long todo items', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('LLM unavailable'));

    const plan = `
1. Short task
2. This is an extremely long task description that goes on and on and includes way too much detail about implementation specifics and technical requirements that should probably be broken down into smaller more manageable pieces but instead is written as one enormous run-on sentence that exceeds reasonable length limits
3. Another short task
`;

    const result = await createPlanStraightforwardTool.execute({
      context: { plan },
    });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] Short task');
    expect(result.todos).toContain('[ ] Another short task');
    expect(result.todos).not.toContain('extremely long task');
  });

  test('should create fallback todo when no actionable items found', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('LLM unavailable'));

    const plan = `
This is just a description of the project goals.
We want to improve user experience.
The system should be fast and reliable.
Quality is important.
`;

    const result = await createPlanStraightforwardTool.execute({
      context: { plan },
    });

    expect(result.success).toBe(true);
    expect(result.todos).toBe('[ ] Review and execute the provided plan');
  });

  test('should handle LLM response with empty todos array', async () => {
    const mockResponse = {
      text: JSON.stringify({
        todos: [],
      }),
    };

    mockGenerateText.mockResolvedValueOnce(mockResponse);

    const plan = 'Create a simple dashboard';

    const result = await createPlanStraightforwardTool.execute({
      context: { plan },
    });

    expect(result.success).toBe(true);
    expect(result.todos).toBe('');
  });

  test('should handle LLM response with non-string todo items', async () => {
    const mockResponse = {
      text: JSON.stringify({
        todos: [
          { todo: 'First task', priority: 'high' },
          'Second task as string',
          { todo: 'Third task', completed: false },
        ],
      }),
    };

    mockGenerateText.mockResolvedValueOnce(mockResponse);

    const plan = 'Create dashboard with multiple features';

    const result = await createPlanStraightforwardTool.execute({
      context: { plan },
    });

    expect(result.success).toBe(true);
    expect(result.todos).toContain('[ ] First task');
    expect(result.todos).toContain('[ ] Second task as string');
    expect(result.todos).toContain('[ ] Third task');
  });
});
