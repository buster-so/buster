import type { CoreMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { formatInitialMessageStepExecution } from './format-initial-message-step';

describe('format-initial-message-step integration', () => {
  it('should format initial message when major assumptions are found', async () => {
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

    // Mock combined input from parallel steps with major assumptions
    const mockInput = {
      conversationHistory: mockConversationHistory,
      name: 'Test Initial Message Analysis',
      messageId: 'msg_12345',
      userId: 'user_67890',
      chatId: 'chat_abcde',
      isFollowUp: false,
      previousMessages: [],
      datasets:
        'name: product\ndescription: Product catalog information\ntables:\n  - name: product\n    description: Product information including bikes and accessories\n  - name: sales_order_header\n    description: Sales order header information\n  - name: credit_card\n    description: Credit card information',

      // Fields from flag-chat step
      toolCalled: 'noIssuesFound',
      summaryMessage: undefined,
      summaryTitle: undefined,
      message: 'No issues detected in this conversation that require data team review.',

      // Fields from identify-assumptions step with major assumptions
      assumptions: [
        {
          descriptiveTitle: 'Stock bikes interpretation',
          classification: 'dataInterpretation' as const,
          explanation:
            'Interpreted "stock" bikes as finished goods ready for sale using finishedgoodsflag field without explicit confirmation',
          label: 'minor' as const,
        },
        {
          descriptiveTitle: 'North America geographic boundaries',
          classification: 'dataInterpretation' as const,
          explanation:
            'Defined North America as US, Canada, and Mexico, excluding American Samoa and other territories which could significantly impact results',
          label: 'major' as const,
        },
        {
          descriptiveTitle: 'Product name pattern matching',
          classification: 'fieldMapping' as const,
          explanation:
            'Used ILIKE pattern matching for Mountain-500 series which could miss products with different naming conventions',
          label: 'major' as const,
        },
      ],
    };

    // Call the step execution function directly
    const result = await formatInitialMessageStepExecution({ inputData: mockInput });

    // Verify the step executed successfully and returned expected structure
    expect(result).toBeDefined();

    // Check that all input fields are passed through
    expect(result.conversationHistory).toEqual(mockConversationHistory);
    expect(result.name).toBe(mockInput.name);
    expect(result.messageId).toBe(mockInput.messageId);
    expect(result.userId).toBe(mockInput.userId);
    expect(result.chatId).toBe(mockInput.chatId);
    expect(result.isFollowUp).toBe(false);
    expect(result.previousMessages).toEqual(mockInput.previousMessages);
    expect(result.datasets).toBe(mockInput.datasets);

    // Check flag-chat fields are passed through
    expect(result.toolCalled).toBe('noIssuesFound');
    expect(result.message).toBe(
      'No issues detected in this conversation that require data team review.'
    );

    // Check assumptions are passed through
    expect(result.assumptions).toBeDefined();
    expect(Array.isArray(result.assumptions)).toBe(true);
    expect(result.assumptions).toHaveLength(3);

    // Check that formatted message was generated since major assumptions exist
    expect(result.formattedMessage).toBeDefined();
    expect(typeof result.formattedMessage).toBe('string');
    expect(result.formattedMessage).not.toBeNull();
    expect(result.formattedMessage!.length).toBeGreaterThan(0);

    // Should contain title and summary format
    expect(result.formattedMessage).toMatch(/.*:.*/); // Should have title: summary format
  });

  it('should return null formatted message when no major assumptions are found', async () => {
    const mockConversationHistory: CoreMessage[] = [
      {
        content: 'Show me total sales for this month',
        role: 'user',
      },
      {
        content: [
          {
            args: {
              final_response: 'Total sales for this month: $125,000',
            },
            toolCallId: 'toolu_simple_query',
            toolName: 'doneTool',
            type: 'tool-call',
          },
        ],
        role: 'assistant',
      },
    ];

    // Mock input with only minor assumptions
    const mockInput = {
      conversationHistory: mockConversationHistory,
      name: 'Test Simple Query Analysis',
      messageId: 'msg_54321',
      userId: 'user_67890',
      chatId: 'chat_abcde',
      isFollowUp: false,
      previousMessages: [],
      datasets: 'name: sales\ndescription: Sales data',

      // Fields from flag-chat step
      toolCalled: 'noIssuesFound',
      summaryMessage: undefined,
      summaryTitle: undefined,
      message: 'No issues detected in this conversation that require data team review.',

      // Fields from identify-assumptions step with only minor assumptions
      assumptions: [
        {
          descriptiveTitle: 'Current month definition',
          classification: 'timePeriodInterpretation' as const,
          explanation: 'Interpreted "this month" as current calendar month',
          label: 'minor' as const,
        },
      ],
    };

    // Call the step execution function directly
    const result = await formatInitialMessageStepExecution({ inputData: mockInput });

    // Verify the step executed successfully and returned expected structure
    expect(result).toBeDefined();

    // Check that formatted message is null since no major assumptions
    expect(result.formattedMessage).toBeNull();

    // Other fields should still be passed through
    expect(result.toolCalled).toBe('noIssuesFound');
    expect(result.assumptions).toHaveLength(1);
    expect(result.assumptions![0].label).toBe('minor');
  });
});
