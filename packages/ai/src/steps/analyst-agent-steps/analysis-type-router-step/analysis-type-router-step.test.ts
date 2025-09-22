import type { ModelMessage } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { runAnalysisTypeRouterStep } from './analysis-type-router-step';

// Mock the GPT5Mini model
vi.mock('../../../llm/gpt-5-mini', () => ({
  GPT5Mini: 'mock-gpt5-mini',
}));

// Mock generateObject
vi.mock('ai', async () => {
  const actual = await vi.importActual('ai');
  return {
    ...actual,
    generateObject: vi.fn(),
  };
});

// Mock wrapTraced
vi.mock('braintrust', () => ({
  wrapTraced: (fn: () => unknown) => fn,
}));

describe('runAnalysisTypeRouterStep', () => {
  it('should route to standard mode for simple queries', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Show me total sales for last month',
      },
    ];

    const result = await runAnalysisTypeRouterStep({ messages });

    // Since we're mocking, it will default to standard
    expect(result.analysisMode).toBe('standard');
    expect(result.reasoning).toBeDefined();
  });

  it('should handle empty messages array', async () => {
    const messages: ModelMessage[] = [];

    const result = await runAnalysisTypeRouterStep({ messages });

    expect(result.analysisMode).toBe('standard');
    expect(result.reasoning).toContain('Defaulting to standard');
  });

  it('should handle multiple messages in conversation history', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'What is causing the revenue drop?',
      },
      {
        role: 'assistant',
        content: 'Let me analyze the revenue trends...',
      },
      {
        role: 'user',
        content: 'Can you dig deeper into the Q3 anomaly?',
      },
    ];

    const result = await runAnalysisTypeRouterStep({ messages });

    expect(result.analysisMode).toBeDefined();
    expect(result.reasoning).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Force an error by passing invalid data
    const messages = null as unknown as ModelMessage[];

    const result = await runAnalysisTypeRouterStep({ messages });

    expect(result.analysisMode).toBe('standard');
    expect(result.reasoning).toContain('Defaulting to standard');
  });
});
