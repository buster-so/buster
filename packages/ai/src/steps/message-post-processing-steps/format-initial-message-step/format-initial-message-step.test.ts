import type { ModelMessage } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import {
  formatInitialMessageParamsSchema,
  formatInitialMessageResultSchema,
  runFormatInitialMessageStep,
} from './format-initial-message-step';

// Mock the LLM module first to prevent initialization
vi.mock('../../../llm/sonnet-4', () => ({
  Sonnet4: Promise.resolve('mocked-sonnet-4-model'),
  getSonnet4: vi.fn().mockResolvedValue('mocked-sonnet-4-model'),
}));

// Mock braintrust to avoid external dependencies in unit tests
vi.mock('braintrust', () => ({
  wrapTraced: vi.fn((fn) => fn),
}));

// Mock the generateObject function to avoid actual LLM calls in unit tests
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

describe('format-initial-message-step', () => {
  describe('schema validation', () => {
    it('should validate input schema correctly', () => {
      const validInput = {
        userName: 'John Doe',
        flaggedIssues: 'No data returned for request',
        majorAssumptions: [
          {
            descriptiveTitle: 'Assumed product table join',
            explanation: 'Joined tables without documentation',
            label: 'major',
          },
        ],
        conversationHistory: [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi there!' },
        ],
      };

      const result = formatInitialMessageParamsSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userName).toBe('John Doe');
        expect(result.data.majorAssumptions).toHaveLength(1);
      }
    });

    it('should validate result schema correctly', () => {
      const validResult = {
        summaryMessage: 'Test summary message',
        summaryTitle: 'Test Title',
      };

      const result = formatInitialMessageResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });
  });

  describe('runFormatInitialMessageStep', () => {
    it('should return empty result when no major assumptions', async () => {
      const params = {
        userName: 'John Doe',
        flaggedIssues: 'No issues',
        majorAssumptions: [], // No major assumptions
      };

      const result = await runFormatInitialMessageStep(params);

      expect(result.summaryMessage).toBe('');
      expect(result.summaryTitle).toBe('');
    });

    it('should generate summary when major assumptions exist', async () => {
      const mockConversationHistory: ModelMessage[] = [
        { role: 'user', content: 'What is the total revenue?' },
        { role: 'assistant', content: 'The total revenue is $1M' },
      ];

      // Mock generateObject to return a summary
      const { generateObject } = await import('ai');
      vi.mocked(generateObject).mockResolvedValue({
        object: {
          title: 'Revenue Calculation Issues',
          summary_message:
            'John requested total revenue data but major assumptions were made about the calculation method.',
        },
      } as any);

      const params = {
        userName: 'John Doe',
        flaggedIssues: 'Major calculation assumptions',
        majorAssumptions: [
          {
            descriptiveTitle: 'Revenue Calculation Method',
            explanation: 'Assumed revenue includes all sources without documentation',
            label: 'major',
          },
        ],
        conversationHistory: mockConversationHistory,
      };

      const result = await runFormatInitialMessageStep(params);

      expect(result.summaryMessage).toBe(
        'John requested total revenue data but major assumptions were made about the calculation method.'
      );
      expect(result.summaryTitle).toBe('Revenue Calculation Issues');
    });

    it('should handle LLM errors gracefully', async () => {
      // Mock generateObject to throw an error
      const { generateObject } = await import('ai');
      vi.mocked(generateObject).mockRejectedValue(new Error('LLM service unavailable'));

      const params = {
        userName: 'Jane Smith',
        flaggedIssues: 'Some issues',
        majorAssumptions: [
          {
            descriptiveTitle: 'Data Join Assumption',
            explanation: 'Joined tables without clear documentation',
            label: 'major',
          },
        ],
      };

      await expect(runFormatInitialMessageStep(params)).rejects.toThrow(
        'Unable to format the initial message. Please try again later.'
      );
    });
  });
});
