import type { ModelMessage } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import {
  formatFollowUpMessageParamsSchema,
  formatFollowUpMessageResultSchema,
  runFormatFollowUpMessageStep,
} from './format-follow-up-message-step';

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

describe('format-follow-up-message-step', () => {
  describe('schema validation', () => {
    it('should validate input schema correctly', () => {
      const validInput = {
        userName: 'John Doe',
        flaggedIssues: 'Additional issues found',
        majorAssumptions: [
          {
            descriptiveTitle: 'Additional data join assumption',
            explanation: 'Made additional assumptions about data relationships',
            label: 'major',
          },
        ],
        conversationHistory: [
          { role: 'user' as const, content: 'Follow-up question' },
          { role: 'assistant' as const, content: 'Follow-up response' },
        ],
      };

      const result = formatFollowUpMessageParamsSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userName).toBe('John Doe');
        expect(result.data.majorAssumptions).toHaveLength(1);
      }
    });

    it('should validate result schema correctly', () => {
      const validResult = {
        summaryMessage: 'Test update message',
        summaryTitle: 'Test Update Title',
      };

      const result = formatFollowUpMessageResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });
  });

  describe('runFormatFollowUpMessageStep', () => {
    it('should return empty result when no major assumptions', async () => {
      const params = {
        userName: 'John Doe',
        flaggedIssues: 'No new issues',
        majorAssumptions: [], // No major assumptions
      };

      const result = await runFormatFollowUpMessageStep(params);

      expect(result.summaryMessage).toBe('');
      expect(result.summaryTitle).toBe('');
    });

    it('should generate update message when major assumptions exist', async () => {
      const mockConversationHistory: ModelMessage[] = [
        { role: 'user', content: 'Can you update the analysis with different filters?' },
        { role: 'assistant', content: 'Here is the updated analysis with new assumptions.' },
      ];

      // Mock generateObject to return an update message
      const { generateObject } = await import('ai');
      vi.mocked(generateObject).mockResolvedValue({
        object: {
          title: 'Filter Update Assumptions',
          update_message:
            'John sent a follow-up request to update the analysis but additional assumptions were made about the filtering criteria.',
        },
      } as any);

      const params = {
        userName: 'John Doe',
        flaggedIssues: 'New filter assumptions',
        majorAssumptions: [
          {
            descriptiveTitle: 'Filter Criteria Assumption',
            explanation: 'Assumed certain filter criteria without clear documentation',
            label: 'major',
          },
        ],
        conversationHistory: mockConversationHistory,
      };

      const result = await runFormatFollowUpMessageStep(params);

      expect(result.summaryMessage).toBe(
        'John sent a follow-up request to update the analysis but additional assumptions were made about the filtering criteria.'
      );
      expect(result.summaryTitle).toBe('Filter Update Assumptions');
    });

    it('should handle LLM errors gracefully', async () => {
      // Mock generateObject to throw an error
      const { generateObject } = await import('ai');
      vi.mocked(generateObject).mockRejectedValue(new Error('LLM service unavailable'));

      const params = {
        userName: 'Jane Smith',
        flaggedIssues: 'Some new issues',
        majorAssumptions: [
          {
            descriptiveTitle: 'Follow-up Assumption',
            explanation: 'Additional assumptions in follow-up',
            label: 'major',
          },
        ],
      };

      await expect(runFormatFollowUpMessageStep(params)).rejects.toThrow(
        'Unable to format the follow-up message. Please try again later.'
      );
    });
  });
});
