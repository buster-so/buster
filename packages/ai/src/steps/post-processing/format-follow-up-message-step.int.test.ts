import type { CoreMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { formatFollowUpMessageStepExecution } from './format-follow-up-message-step';

describe('format-follow-up-message-step integration', () => {
  it('should format follow-up message with new issues and assumptions', async () => {
    const mockConversationHistory: CoreMessage[] = [
      {
        content: 'Can you also show me monthly trends for these sales?',
        role: 'user',
      },
      {
        content: [
          {
            args: {
              final_response:
                "I'll create a monthly trend analysis for Mountain-500 series bike sales. However, I need to make some assumptions about the date ranges since this wasn't specified in your original query.",
            },
            toolCallId: 'toolu_01Follow123',
            toolName: 'doneTool',
            type: 'tool-call',
          },
        ],
        role: 'assistant',
      },
    ];

    // Mock combined input from parallel steps with follow-up context
    const mockInput = {
      conversationHistory: mockConversationHistory,
      name: 'Test Follow-up Message Analysis',
      messageId: 'msg_67890',
      userId: 'user_67890',
      chatId: 'chat_abcde',
      isFollowUp: true,
      previousMessages: [
        'Mountain-500 Series Analysis: Found assumptions about stock bike interpretation and geographic boundaries that require data team review.',
      ],
      datasets:
        'name: product\ndescription: Product catalog information\ntables:\n  - name: product\n    description: Product information including bikes and accessories\n  - name: sales_order_header\n    description: Sales order header information with date fields',

      // Fields from flag-chat step
      toolCalled: 'flagChat',
      summaryMessage: 'New issues detected with date range assumptions in follow-up query',
      summaryTitle: 'Date Range Assumptions',
      message: undefined,

      // Fields from identify-assumptions step
      assumptions: [
        {
          descriptiveTitle: 'Date range assumption for monthly trends',
          classification: 'timePeriodInterpretation' as const,
          explanation:
            'User requested monthly trends but did not specify date range, so assuming all available historical data',
          label: 'major' as const,
        },
        {
          descriptiveTitle: 'Monthly granularity assumption',
          classification: 'timePeriodGranularity' as const,
          explanation:
            'Assuming calendar months rather than rolling 30-day periods for trend analysis',
          label: 'minor' as const,
        },
      ],
    };

    // Call the step execution function directly
    const result = await formatFollowUpMessageStepExecution({ inputData: mockInput });

    // Verify the step executed successfully and returned expected structure
    expect(result).toBeDefined();

    // Check that all input fields are passed through
    expect(result.conversationHistory).toEqual(mockConversationHistory);
    expect(result.name).toBe(mockInput.name);
    expect(result.messageId).toBe(mockInput.messageId);
    expect(result.userId).toBe(mockInput.userId);
    expect(result.chatId).toBe(mockInput.chatId);
    expect(result.isFollowUp).toBe(true);
    expect(result.previousMessages).toEqual(mockInput.previousMessages);
    expect(result.datasets).toBe(mockInput.datasets);

    // Check flag-chat fields are passed through
    expect(result.toolCalled).toBe('flagChat');
    expect(result.summaryMessage).toBe(
      'New issues detected with date range assumptions in follow-up query'
    );
    expect(result.summaryTitle).toBe('Date Range Assumptions');

    // Check assumptions are passed through
    expect(result.assumptions).toBeDefined();
    expect(Array.isArray(result.assumptions)).toBe(true);
    expect(result.assumptions).toHaveLength(2);

    // Check that formatted message was generated for follow-up
    expect(result.formattedMessage).toBeDefined();
    expect(typeof result.formattedMessage).toBe('string');
    expect(result.formattedMessage).not.toBeNull();
    expect(result.formattedMessage!.length).toBeGreaterThan(0);
  });
});
