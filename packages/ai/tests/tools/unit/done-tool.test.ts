import { describe, expect, test, beforeEach } from 'vitest';
import { doneTool, doneToolWithSummary } from '@tools/done-tool';

// Mock the SessionManager for testing
const mockSessionManager = {
  getSessionStartTime: () => Date.now() - 60000, // 1 minute ago
  setState: () => {},
  getState: (key: string) => {
    if (key === 'created_metrics') return [];
    if (key === 'created_dashboards') return [];
    if (key === 'executed_queries') return [];
    return undefined;
  },
  endSession: () => {},
};

describe('Done Tool Unit Tests', () => {
  beforeEach(() => {
    // Reset any state between tests if needed
  });

  test('should have correct configuration', () => {
    expect(doneTool.id).toBe('done');
    expect(doneTool.description).toBe('Signal completion of all requested tasks and end the workflow');
    expect(doneTool.inputSchema).toBeDefined();
    expect(doneTool.outputSchema).toBeDefined();
    expect(doneTool.execute).toBeDefined();
  });

  test('should validate input schema', () => {
    const validInput = {
      message: 'Task completed successfully',
      summary: 'Created 2 dashboards and 3 metrics',
      final_artifacts: [
        {
          type: 'dashboard' as const,
          id: '123',
          title: 'Sales Dashboard',
          description: 'Monthly sales overview',
        },
      ],
    };
    const result = doneTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate output schema structure', () => {
    const validOutput = {
      success: true,
      message: 'Task completed successfully',
      session_ended: true,
      artifacts_created: 1,
      session_duration: 60000,
    };

    const result = doneTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should signal completion successfully with message', async () => {
    const message = 'All tasks completed successfully';
    const result = await doneTool.execute({
      context: { message },
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe(message);
    expect(result.session_ended).toBe(true);
    expect(result.artifacts_created).toBe(0);
    expect(result.session_duration).toBeGreaterThanOrEqual(0);
  });

  test('should generate default message when none provided', async () => {
    const result = await doneTool.execute({
      context: {},
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Task completed successfully.');
    expect(result.session_ended).toBe(true);
  });

  test('should include artifacts in completion message', async () => {
    const artifacts = [
      {
        type: 'dashboard' as const,
        id: '123',
        title: 'Sales Dashboard',
        description: 'Monthly sales overview',
      },
      {
        type: 'metric' as const,
        id: '456',
        title: 'Revenue Metric',
      },
    ];

    const result = await doneTool.execute({
      context: {
        message: 'Created dashboards and metrics',
        final_artifacts: artifacts,
      },
    });

    expect(result.success).toBe(true);
    expect(result.artifacts_created).toBe(2);
    expect(result.message).toContain('Sales Dashboard');
    expect(result.message).toContain('Revenue Metric');
    expect(result.message).toContain('Monthly sales overview');
  });

  test('should include summary in completion message', async () => {
    const summary = 'Successfully analyzed Q4 data and created visualizations';
    const result = await doneTool.execute({
      context: {
        message: 'Analysis complete',
        summary,
      },
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Analysis complete');
    expect(result.message).toContain(summary);
  });

  test('should calculate session duration correctly', async () => {
    const result = await doneTool.execute({
      context: { message: 'Test completion' },
    });

    expect(result.success).toBe(true);
    expect(result.session_duration).toBeGreaterThanOrEqual(0);
    expect(result.session_duration).toBeLessThan(300000); // Less than 5 minutes should be reasonable
  });

  test('should handle empty artifacts array', async () => {
    const result = await doneTool.execute({
      context: {
        message: 'No artifacts created',
        final_artifacts: [],
      },
    });

    expect(result.success).toBe(true);
    expect(result.artifacts_created).toBe(0);
    expect(result.message).not.toContain('Created artifacts:');
  });
});

describe('Done Tool With Summary Unit Tests', () => {
  test('should have correct configuration', () => {
    expect(doneToolWithSummary.id).toBe('done-with-summary');
    expect(doneToolWithSummary.description).toBe('Signal completion with automatic session summary generation');
    expect(doneToolWithSummary.inputSchema).toBeDefined();
    expect(doneToolWithSummary.outputSchema).toBeDefined();
  });

  test('should validate input schema', () => {
    const validInput = {
      message: 'Task completed',
      include_auto_summary: true,
    };
    const result = doneToolWithSummary.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should generate auto summary by default', async () => {
    const result = await doneToolWithSummary.execute({
      context: { message: 'Test with auto summary' },
    });

    expect(result.success).toBe(true);
    expect(result.auto_summary).toBeDefined();
    expect(result.auto_summary).toContain('Session Summary:');
  });

  test('should skip auto summary when include_auto_summary=false', async () => {
    const result = await doneToolWithSummary.execute({
      context: {
        message: 'Test without auto summary',
        include_auto_summary: false,
      },
    });

    expect(result.success).toBe(true);
    expect(result.auto_summary).toBeUndefined();
  });

  test('should include auto summary in message', async () => {
    const result = await doneToolWithSummary.execute({
      context: { message: 'Custom message' },
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Custom message');
    expect(result.message).toContain('Session Summary:');
  });
});