import { doneTool, doneToolWithSummary } from '@/tools/communication-tools/done-tool';
import { beforeEach, describe, expect, test } from 'vitest';

describe('Done Tool Integration Tests', () => {
  beforeEach(() => {
    // Reset session state between tests if needed
  });

  test('should complete workflow with basic message', async () => {
    const result = await doneTool.execute({
      context: {
        message: 'Task completed successfully',
      },
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Task completed successfully');
    expect(result.session_ended).toBe(true);
    expect(result.artifacts_created).toBe(0);
    expect(result.session_duration).toBeGreaterThanOrEqual(0);
  });

  test('should handle completion with multiple artifacts', async () => {
    const artifacts = [
      {
        type: 'dashboard' as const,
        id: 'dash-001',
        title: 'Sales Dashboard',
        description: 'Q4 sales performance overview',
      },
      {
        type: 'metric' as const,
        id: 'metric-001',
        title: 'Revenue Metric',
        description: 'Monthly recurring revenue',
      },
      {
        type: 'report' as const,
        id: 'report-001',
        title: 'Analysis Report',
      },
    ];

    const result = await doneTool.execute({
      context: {
        message: 'Analysis workflow completed',
        summary: 'Created comprehensive business intelligence suite',
        final_artifacts: artifacts,
      },
    });

    expect(result.success).toBe(true);
    expect(result.artifacts_created).toBe(3);
    expect(result.message).toContain('Sales Dashboard');
    expect(result.message).toContain('Revenue Metric');
    expect(result.message).toContain('Analysis Report');
    expect(result.message).toContain('Q4 sales performance overview');
    expect(result.message).toContain('Created comprehensive business intelligence suite');
  });

  test('should handle completion without artifacts', async () => {
    const result = await doneTool.execute({
      context: {
        message: 'Information request completed',
        summary: 'Provided explanations and guidance',
      },
    });

    expect(result.success).toBe(true);
    expect(result.artifacts_created).toBe(0);
    expect(result.message).toContain('Information request completed');
    expect(result.message).toContain('Provided explanations and guidance');
    expect(result.message).not.toContain('Created artifacts:');
  });

  test('should generate default message when none provided', async () => {
    const result = await doneTool.execute({
      context: {
        message: '',
      },
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Task completed successfully.');
    expect(result.session_ended).toBe(true);
  });

  test('should calculate session duration accurately', async () => {
    const result = await doneTool.execute({
      context: { message: 'Duration test' },
    });

    // The mock getSessionStartTime returns Date.now() - 60000, so duration should be around 60000ms
    expect(result.session_duration).toBeGreaterThan(59000); // Allow some variance
    expect(result.session_duration).toBeLessThan(61000); // Should be around 60 seconds
  });

  test('should handle artifact with missing optional fields', async () => {
    const artifacts = [
      {
        type: 'analysis' as const,
        id: 'analysis-001',
        title: 'Data Analysis',
        // No description provided
      },
    ];

    const result = await doneTool.execute({
      context: {
        message: 'Analysis completed',
        final_artifacts: artifacts,
      },
    });

    expect(result.success).toBe(true);
    expect(result.artifacts_created).toBe(1);
    expect(result.message).toContain('Data Analysis');
    expect(result.message).not.toContain(' - undefined');
  });

  test('should validate input schema correctly', () => {
    // Test valid input
    const validInput = { message: 'Task completed successfully' };
    const validResult = doneTool.inputSchema.safeParse(validInput);
    expect(validResult.success).toBe(true);

    // Test invalid input (missing message)
    const invalidInput = {};
    const invalidResult = doneTool.inputSchema.safeParse(invalidInput);
    expect(invalidResult.success).toBe(false);
  });

  test('should validate output schema correctly', () => {
    const validOutput = {
      success: true,
      message: 'Test',
      session_ended: true,
      artifacts_created: 0,
      session_duration: 1000,
    };
    const result = doneTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should have correct tool configuration', () => {
    expect(doneTool.id).toBe('done');
    expect(doneTool.description).toBe(
      'Signal completion of all requested tasks and end the workflow'
    );
    expect(doneTool.inputSchema).toBeDefined();
    expect(doneTool.outputSchema).toBeDefined();
    expect(doneTool.execute).toBeDefined();
  });

  test('should handle markdown message formatting', async () => {
    const markdownMessage = `
## Task Complete

- Created dashboard
- Generated reports  
- Analyzed data

Task finished successfully.
    `.trim();

    const result = await doneTool.execute({
      context: {
        message: markdownMessage,
      },
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('## Task Complete');
  });

  test('should handle long message content', async () => {
    const longMessage = `${'A'.repeat(1000)} - Task completed successfully`;

    const result = await doneTool.execute({
      context: {
        message: longMessage,
      },
    });

    expect(result.success).toBe(true);
  });
});

describe('Done Tool With Summary Integration Tests', () => {
  test('should generate automatic summary', async () => {
    const result = await doneToolWithSummary.execute({
      context: {
        message: 'Workflow completed with auto-summary',
        include_auto_summary: true,
      },
    });

    expect(result.success).toBe(true);
    expect(result.auto_summary).toBeDefined();
    expect(result.auto_summary).toContain('Session Summary:');
    expect(result.message).toContain('Workflow completed with auto-summary');
    expect(result.message).toContain('Session Summary:');
  });

  test('should skip auto-summary when requested', async () => {
    const result = await doneToolWithSummary.execute({
      context: {
        message: 'Manual completion message',
        include_auto_summary: false,
      },
    });

    expect(result.success).toBe(true);
    expect(result.auto_summary).toBeUndefined();
    expect(result.message).toBe('Manual completion message');
  });

  test('should default to including auto-summary', async () => {
    const result = await doneToolWithSummary.execute({
      context: { message: 'Default behavior test' },
    });

    expect(result.success).toBe(true);
    expect(result.auto_summary).toBeDefined();
    expect(result.message).toContain('Default behavior test');
    expect(result.message).toContain('Session Summary:');
  });

  test('should handle summary generation for empty session', async () => {
    const result = await doneToolWithSummary.execute({
      context: { message: 'Empty session test' },
    });

    expect(result.success).toBe(true);
    expect(result.auto_summary).toContain('No artifacts were created');
  });
});
