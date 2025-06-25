import type { CoreMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { identifyAssumptionsStepExecution } from './identify-assumptions-step';

describe('identify-assumptions-step integration', () => {
  it('should analyze conversation history and return assumptions results', async () => {
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
              isRevision: false,
              needsMoreThoughts: false,
              nextThoughtNeeded: true,
              thought:
                'Let me start by thinking through the TODO items to understand what data I need to identify for this specific query about Mountain-500 series bikes sold online to NA customers using a ColonialVoice card.\n\n1. **Determine how "Mountain-500 series bikes" are identified in the product data**\nLooking at the product model, I can see there\'s a `name` dimension that would contain product names. Mountain-500 series would likely be identified by products with names containing "Mountain-500" or similar patterns. I should check if this exists in the data.\n\n2. **Determine how to filter for "stock" bikes versus other types**\nThis is unclear from the documentation. The product model has various flags like `makeflag` (indicates if manufactured in-house) and `finishedgoodsflag` (indicates if finished and ready for sale), but there\'s no explicit "stock" indicator. I may need to investigate what "stock" means in this context - it could refer to finished goods that are ready for sale.\n\n3. **Determine how "online" sales are identified versus other sales channels**\nIn the sales_order_header model, there\'s an `onlineorderflag` dimension that\'s a boolean indicating if the order was placed online. This directly addresses the online sales requirement.\n\n4. **Determine how "NA customers" are identified in the customer data**\n"NA" likely refers to North America. I need to trace through the customer → address → state_province → country_region relationships to identify customers in North American countries (US, Canada, Mexico). The customer model has a `territoryid` that links to sales_territory, and sales_territory has `countryregioncode` that links to country_region.\n\n5. **Determine how "ColonialVoice card" payment method is identified**\nIn the credit_card model, there\'s a `cardtype` dimension that contains credit card types like "Visa or MasterCard". "ColonialVoice" would be a specific card type that should appear in this field.\n\n6. **Determine the visualization type and axes for displaying the count**\nSince this is asking for "how many" (a count), this would be best displayed as a single number card showing the total count of qualifying sales.\n\nNow I need to determine if I have sufficient information or if I need to use executeSQL to validate some of these assumptions, particularly around the specific values like "Mountain-500", "ColonialVoice", and North American country codes.',
              thoughtNumber: 1,
              totalThoughts: 3,
            },
            toolCallId: 'toolu_01De2VQ9M2mhHxf1rNvxSkf1',
            toolName: 'sequentialThinking',
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
            toolCallId: 'toolu_01De2VQ9M2mhHxf1rNvxSkf1',
            toolName: 'sequentialThinking',
            type: 'tool-result',
          },
        ],
        role: 'tool',
      },
      {
        content: [
          {
            args: {
              final_response:
                "I found the answer to your specific question about Mountain-500 series bikes sold online to North American customers using ColonialVoice cards.\n\n**Result: 47 Mountain-500 series bikes were sold under these exact conditions.**\n\nHere's how I identified and filtered the data based on your requirements:\n\n- **Mountain-500 series bikes**: Found 10 different Mountain-500 variants in the database (5 black and 5 silver in various sizes: 40, 42, 44, 48, 52)\n- **Stock bikes**: Filtered for finished goods ready for sale (using the `finishedgoodsflag`)\n- **Online sales**: Used the online order flag to identify web-based purchases\n- **NA customers**: Included customers from United States, Canada, and Mexico\n- **ColonialVoice card**: Filtered specifically for this credit card type (which exists in the database alongside Vista, SuperiorCard, and Distinguish)\n\nThe analysis shows that despite the very specific filtering criteria, there was still a meaningful volume of 47 bikes sold through this particular channel combination. This suggests that ColonialVoice cardholders in North America represent an active customer segment for the Mountain-500 product line in online sales.",
            },
            toolCallId: 'toolu_01WAfvCoQtpBoNdmNi17LKCe',
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
            toolCallId: 'toolu_01WAfvCoQtpBoNdmNi17LKCe',
            toolName: 'doneTool',
            type: 'tool-result',
          },
        ],
        role: 'tool',
      },
    ];

    const mockInput = {
      conversationHistory: mockConversationHistory,
      name: 'Test Identify Assumptions Analysis',
      messageId: 'msg_12345',
      userId: 'user_67890',
      chatId: 'chat_abcde',
      isFollowUp: false,
      previousMessages: [],
      datasets:
        'name: product\ndescription: Product catalog information\ntables:\n  - name: product\n    description: Product information including bikes and accessories\n    columns:\n      - name: name\n        description: Product name\n      - name: finishedgoodsflag\n        description: Indicates if finished and ready for sale\n  - name: sales_order_header\n    description: Sales order header information\n    columns:\n      - name: onlineorderflag\n        description: Boolean indicating if order was placed online\n  - name: credit_card\n    description: Credit card information\n    columns:\n      - name: cardtype\n        description: Type of credit card',
    };

    // Call the step execution function directly
    const result = await identifyAssumptionsStepExecution({ inputData: mockInput });

    // Verify the step executed successfully and returned expected structure
    expect(result).toBeDefined();
    expect(result.toolCalled).toBeDefined();
    expect(typeof result.toolCalled).toBe('string');
    expect(result.name).toBe(mockInput.name);
    expect(result.messageId).toBe(mockInput.messageId);
    expect(result.userId).toBe(mockInput.userId);
    expect(result.chatId).toBe(mockInput.chatId);
    expect(result.isFollowUp).toBe(mockInput.isFollowUp);
    expect(result.conversationHistory).toEqual(mockConversationHistory);

    // Should have either assumptions array OR be empty based on tool called
    if (result.toolCalled === 'listAssumptionsResponse') {
      expect(result.assumptions).toBeDefined();
      expect(Array.isArray(result.assumptions)).toBe(true);
      if (result.assumptions && result.assumptions.length > 0) {
        expect(result.assumptions[0]).toHaveProperty('descriptiveTitle');
        expect(result.assumptions[0]).toHaveProperty('classification');
        expect(result.assumptions[0]).toHaveProperty('explanation');
        expect(result.assumptions[0]).toHaveProperty('label');
      }
    } else if (result.toolCalled === 'noAssumptionsIdentified') {
      expect(result.assumptions).toBeUndefined();
    }
  });
});
