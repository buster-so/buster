import type { CoreMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { formatFollowUpMessageStepExecution } from './format-follow-up-message-step';

describe('format-follow-up-message-step integration', () => {
  it('should format follow-up message with new issues and assumptions', async () => {
    const mockConversationHistory: CoreMessage[] = [
      {
        content:
          'How many stock Mountain-500 series bikes were sold online to NA customers using a ColonialVoice card?',
        role: 'user',
      },
      {
        content: [
          {
            text: '<todo_list>\n        - Below are the items on your TODO list:\n        [ ] Determine how "Mountain-500 series bikes" are identified in the product data\n[ ] Determine how to filter for "stock" bikes versus other types\n[ ] Determine how "online" sales are identified versus other sales channels\n[ ] Determine how "NA customers" are identified in the customer data\n[ ] Determine how "ColonialVoice card" payment method is identified\n[ ] Determine the visualization type and axes for displaying the count\n        </todo_list>',
            type: 'text',
          },
        ],
        role: 'user',
      },
      {
        content: [
          {
            args: {
              final_response:
                "I found the answer to your specific question about Mountain-500 series bikes sold online to North American customers using ColonialVoice cards.\n\n**Result: 47 Mountain-500 series bikes were sold under these exact conditions.**\n\nHere's how I identified and filtered the data based on your requirements:\n\n- **Mountain-500 series bikes**: Found 10 different Mountain-500 variants in the database (5 black and 5 silver in various sizes: 40, 42, 44, 48, 52)\n- **Stock bikes**: Filtered for finished goods ready for sale (using the `finishedgoodsflag`)\n- **Online sales**: Used the online order flag to identify web-based purchases\n- **NA customers**: Included customers from United States, Canada, and Mexico\n- **ColonialVoice card**: Filtered specifically for this credit card type (which exists in the database alongside Vista, SuperiorCard, and Distinguish)\n\nThe analysis shows that despite the very specific filtering criteria, there was still a meaningful volume of 47 bikes sold through this particular channel combination. This suggests that ColonialVoice cardholders in North America represent an active customer segment for the Mountain-500 product line in online sales.",
            },
            toolCallId: 'toolu_06WAfvCoQtpBoNdmNi17LKCe',
            toolName: 'doneTool',
            type: 'tool-call',
          },
        ],
        role: 'assistant',
      },
      {
        content: [
          {
            result: {
              success: true,
            },
            toolCallId: 'toolu_06WAfvCoQtpBoNdmNi17LKCe',
            toolName: 'doneTool',
            type: 'tool-result',
          },
        ],
        role: 'tool',
      },
    ];

    // Mock combined input from parallel steps with follow-up context
    const mockInput = {
      conversationHistory: mockConversationHistory,
      userName: 'John',
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
    expect(result.userName).toBe(mockInput.userName);
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
