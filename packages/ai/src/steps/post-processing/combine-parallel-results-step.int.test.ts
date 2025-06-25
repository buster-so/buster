import type { CoreMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { combineParallelResultsStepExecution } from './combine-parallel-results-step';

describe('combine-parallel-results-step integration', () => {
  it('should combine results from flag-chat and identify-assumptions steps', async () => {
    const mockConversationHistory: CoreMessage[] = [
      {
        content:
          'How many stock Mountain-500 series bikes were sold online to NA customers using a ColonialVoice card?',
        role: 'user',
      },
      {
        content: [
          {
            args: {
              final_response:
                'I found the answer to your specific question about Mountain-500 series bikes sold online to North American customers using ColonialVoice cards.\n\n**Result: 47 Mountain-500 series bikes were sold under these exact conditions.**',
            },
            toolCallId: 'toolu_01WAfvCoQtpBoNdmNi17LKCe',
            toolName: 'doneTool',
            type: 'tool-call',
          },
        ],
        role: 'assistant',
      },
    ];

    // Mock the parallel results that would come from the previous steps
    const mockParallelResults = {
      'flag-chat': {
        conversationHistory: mockConversationHistory,
        name: 'Test Flag Chat Analysis',
        messageId: 'msg_12345',
        userId: 'user_67890',
        chatId: 'chat_abcde',
        isFollowUp: false,
        previousMessages: [],
        datasets: 'name: product\ndescription: Product catalog information',
        toolCalled: 'noIssuesFound',
        summaryMessage: undefined,
        summaryTitle: undefined,
        message: 'No issues detected in this conversation that require data team review.',
      },
      'identify-assumptions': {
        conversationHistory: mockConversationHistory,
        name: 'Test Identify Assumptions Analysis',
        messageId: 'msg_12345',
        userId: 'user_67890',
        chatId: 'chat_abcde',
        isFollowUp: false,
        previousMessages: [],
        datasets: 'name: product\ndescription: Product catalog information',
        toolCalled: 'listAssumptionsResponse',
        assumptions: [
          {
            descriptiveTitle: 'Stock bikes interpretation',
            classification: 'dataInterpretation' as const,
            explanation:
              'Interpreted "stock" bikes as finished goods ready for sale using finishedgoodsflag field',
            label: 'minor' as const,
          },
          {
            descriptiveTitle: 'North America countries selection',
            classification: 'dataInterpretation' as const,
            explanation:
              'Selected US, CA, MX as North American countries, excluding American Samoa',
            label: 'major' as const,
          },
        ],
      },
    };

    // Call the step execution function directly
    const result = await combineParallelResultsStepExecution({ inputData: mockParallelResults });

    // Verify the step executed successfully and returned expected structure
    expect(result).toBeDefined();

    // Check that all base fields are passed through from flag-chat result
    expect(result.conversationHistory).toEqual(mockConversationHistory);
    expect(result.name).toBe('Test Flag Chat Analysis');
    expect(result.messageId).toBe('msg_12345');
    expect(result.userId).toBe('user_67890');
    expect(result.chatId).toBe('chat_abcde');
    expect(result.isFollowUp).toBe(false);
    expect(result.previousMessages).toEqual([]);
    expect(result.datasets).toBe('name: product\ndescription: Product catalog information');

    // Check flag-chat fields
    expect(result.toolCalled).toBe('noIssuesFound');
    expect(result.message).toBe(
      'No issues detected in this conversation that require data team review.'
    );
    expect(result.summaryMessage).toBeUndefined();
    expect(result.summaryTitle).toBeUndefined();

    // Check identify-assumptions fields
    expect(result.assumptions).toBeDefined();
    expect(Array.isArray(result.assumptions)).toBe(true);
    expect(result.assumptions).toHaveLength(2);
    expect(result.assumptions![0]).toHaveProperty('descriptiveTitle', 'Stock bikes interpretation');
    expect(result.assumptions![0]).toHaveProperty('classification', 'dataInterpretation');
    expect(result.assumptions![0]).toHaveProperty('label', 'minor');
    expect(result.assumptions![1]).toHaveProperty(
      'descriptiveTitle',
      'North America countries selection'
    );
    expect(result.assumptions![1]).toHaveProperty('label', 'major');
  });
});
