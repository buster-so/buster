import { AI_KEYS, getSecret } from '@buster/secrets';
import type { ModelMessage } from 'ai';
import { initLogger } from 'braintrust';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import runMessagePostProcessingWorkflow, {
  type PostProcessingWorkflowInput,
} from './message-post-processing-workflow';

describe('Post-Processing Workflow Integration Tests', () => {
  beforeAll(async () => {
    try {
      const apiKey = await getSecret(AI_KEYS.BRAINTRUST_KEY);
      const projectName = await getSecret(AI_KEYS.ENVIRONMENT);

      if (apiKey && projectName) {
        initLogger({
          apiKey,
          projectName,
        });
      }
    } catch {
      // Skip logger initialization if secrets aren't available
    }
  });

  afterAll(async () => {
    // Allow time for cleanup operations
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  it('should successfully execute post-processing workflow and return output', async () => {
    const mockConversationHistory = [
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
            input: {
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
            input: {
              statements: [
                "SELECT DISTINCT p.name FROM postgres.ont_ont.product p WHERE p.name ILIKE '%Mountain-500%' LIMIT 25",
                "SELECT DISTINCT p.name FROM postgres.ont_ont.product p WHERE p.name ILIKE '%Mountain%' AND p.name ILIKE '%500%' LIMIT 25",
                "SELECT DISTINCT cc.cardtype FROM postgres.ont_ont.credit_card cc WHERE cc.cardtype ILIKE '%Colonial%' OR cc.cardtype ILIKE '%Voice%' LIMIT 25",
                'SELECT DISTINCT cc.cardtype FROM postgres.ont_ont.credit_card cc LIMIT 25',
                "SELECT DISTINCT cr.countryregioncode, cr.name FROM postgres.ont_ont.country_region cr WHERE cr.name ILIKE '%America%' OR cr.countryregioncode IN ('US', 'CA', 'MX') LIMIT 25",
              ],
            },
            toolCallId: 'toolu_01Ufu6nZQvYAXaQr2XZHKptL',
            toolName: 'executeSql',
            type: 'tool-call',
          },
        ],
        role: 'assistant',
      },
      {
        content: [
          {
            result: {
              results: [
                {
                  results: [
                    { name: 'Mountain-500 Black, 40' },
                    { name: 'Mountain-500 Black, 42' },
                    { name: 'Mountain-500 Black, 44' },
                    { name: 'Mountain-500 Black, 48' },
                    { name: 'Mountain-500 Black, 52' },
                    { name: 'Mountain-500 Silver, 40' },
                    { name: 'Mountain-500 Silver, 42' },
                    { name: 'Mountain-500 Silver, 44' },
                    { name: 'Mountain-500 Silver, 48' },
                    { name: 'Mountain-500 Silver, 52' },
                  ],
                  sql: "SELECT DISTINCT p.name FROM postgres.ont_ont.product p WHERE p.name ILIKE '%Mountain-500%' LIMIT 25",
                  status: 'success',
                },
                {
                  results: [
                    { name: 'Mountain-500 Black, 40' },
                    { name: 'Mountain-500 Black, 42' },
                    { name: 'Mountain-500 Black, 44' },
                    { name: 'Mountain-500 Black, 48' },
                    { name: 'Mountain-500 Black, 52' },
                    { name: 'Mountain-500 Silver, 40' },
                    { name: 'Mountain-500 Silver, 42' },
                    { name: 'Mountain-500 Silver, 44' },
                    { name: 'Mountain-500 Silver, 48' },
                    { name: 'Mountain-500 Silver, 52' },
                  ],
                  sql: "SELECT DISTINCT p.name FROM postgres.ont_ont.product p WHERE p.name ILIKE '%Mountain%' AND p.name ILIKE '%500%' LIMIT 25",
                  status: 'success',
                },
                {
                  results: [{ cardtype: 'ColonialVoice' }],
                  sql: "SELECT DISTINCT cc.cardtype FROM postgres.ont_ont.credit_card cc WHERE cc.cardtype ILIKE '%Colonial%' OR cc.cardtype ILIKE '%Voice%' LIMIT 25",
                  status: 'success',
                },
                {
                  results: [
                    { cardtype: 'Vista' },
                    { cardtype: 'SuperiorCard' },
                    { cardtype: 'Distinguish' },
                    { cardtype: 'ColonialVoice' },
                  ],
                  sql: 'SELECT DISTINCT cc.cardtype FROM postgres.ont_ont.credit_card cc LIMIT 25',
                  status: 'success',
                },
                {
                  results: [
                    { countryregioncode: 'AS', name: 'American Samoa' },
                    { countryregioncode: 'CA', name: 'Canada' },
                    { countryregioncode: 'MX', name: 'Mexico' },
                    { countryregioncode: 'US', name: 'United States' },
                  ],
                  sql: "SELECT DISTINCT cr.countryregioncode, cr.name FROM postgres.ont_ont.country_region cr WHERE cr.name ILIKE '%America%' OR cr.countryregioncode IN ('US', 'CA', 'MX') LIMIT 25",
                  status: 'success',
                },
              ],
            },
            toolCallId: 'toolu_01Ufu6nZQvYAXaQr2XZHKptL',
            toolName: 'executeSql',
            type: 'tool-result',
          },
        ],
        role: 'tool',
      },
      {
        content: [
          {
            args: {
              isRevision: false,
              needsMoreThoughts: false,
              nextThoughtNeeded: true,
              thought:
                'Excellent! The SQL queries have provided very helpful validation of my assumptions:\n\n1. **Mountain-500 series bikes**: Confirmed! There are exactly 10 Mountain-500 products in the database - 5 black variants and 5 silver variants in different sizes (40, 42, 44, 48, 52). I can filter using `p.name ILIKE \'%Mountain-500%\'`.\n\n2. **ColonialVoice card**: Perfect! "ColonialVoice" exists as an exact cardtype in the credit_card table. I can filter using `cc.cardtype = \'ColonialVoice\'`.\n\n3. **NA customers**: Great! I found the North American countries:\n   - US (United States)\n   - CA (Canada) \n   - MX (Mexico)\n   - AS (American Samoa) - though this might be debatable as "NA"\n   \n   For this analysis, I\'ll focus on US, CA, and MX as the primary North American countries.\n\nNow I need to think about the "stock" bikes requirement. Looking at the product model again, I see there\'s a `finishedgoodsflag` boolean that "indicates if the product is finished and ready for sale". This seems like the most logical interpretation of "stock" bikes - products that are finished goods ready for sale, as opposed to components or work-in-progress items.\n\nLet me also verify that I can properly join all the necessary tables to get this data:\n- sales_order_header (for online orders)\n- sales_order_detail (for product details and quantities)\n- product (for Mountain-500 filtering and finished goods flag)\n- credit_card (for ColonialVoice filtering)\n- customer (to link to territory)\n- sales_territory (to get country region)\n- country_region (to filter for NA countries)\n\nThe relationships look good based on the entity references in the documentation.',
              thoughtNumber: 2,
              totalThoughts: 3,
            },
            toolCallId: 'toolu_02KKXA1KUXcCAHjA2jAjfSXE',
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
            toolCallId: 'toolu_02KKXA1KUXcCAHjA2jAjfSXE',
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
              isRevision: false,
              needsMoreThoughts: false,
              nextThoughtNeeded: false,
              thought:
                "Now let me finalize my resolution of all TODO items and plan the analysis:\n\n**Final TODO Item Resolutions:**\n\n1. **✓ Mountain-500 series bikes identification**: Filter products using `p.name ILIKE '%Mountain-500%'` - confirmed 10 variants exist in the database.\n\n2. **✓ \"Stock\" bikes filtering**: Use `p.finishedgoodsflag = true` to identify finished goods ready for sale, which is the most logical interpretation of \"stock\" bikes versus components or work-in-progress.\n\n3. **✓ Online sales identification**: Use `soh.onlineorderflag = true` from the sales_order_header table.\n\n4. **✓ NA customers identification**: Filter for customers in North American countries using country region codes 'US', 'CA', 'MX' through the customer → sales_territory → country_region relationship chain.\n\n5. **✓ ColonialVoice card identification**: Filter using `cc.cardtype = 'ColonialVoice'` - confirmed this exact value exists in the database.\n\n6. **✓ Visualization type**: Since the question asks \"how many\" (requesting a count), this should be displayed as a number card showing the total count of qualifying bike sales.\n\n**Analysis Plan:**\nI need to create a metric that counts the quantity of Mountain-500 series bikes sold that meet all the specified criteria. The SQL will need to:\n- JOIN sales_order_header, sales_order_detail, product, credit_card, customer, sales_territory, and country_region tables\n- Filter for online orders, Mountain-500 products, finished goods, ColonialVoice payments, and NA customers\n- SUM the order quantities to get the total number of bikes sold\n\nThis is a complex multi-table join but all the relationships are well-defined in the documentation. The result will be a single number representing the total count of qualifying bike sales.\n\nAll TODO items are now thoroughly addressed and I'm ready to proceed with the analysis phase.",
              thoughtNumber: 3,
              totalThoughts: 3,
            },
            toolCallId: 'toolu_03QyPGts4d3WdGmFmrd5urVT',
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
            toolCallId: 'toolu_03QyPGts4d3WdGmFmrd5urVT',
            toolName: 'sequentialThinking',
            type: 'tool-result',
          },
        ],
        role: 'tool',
      },
      {
        content: [
          {
            args: {},
            toolCallId: 'toolu_04T6RXZpViewbAVZWYD5YxRd',
            toolName: 'submitThoughts',
            type: 'tool-call',
          },
        ],
        role: 'assistant',
      },
      {
        content: [
          {
            result: {},
            toolCallId: 'toolu_04T6RXZpViewbAVZWYD5YxRd',
            toolName: 'submitThoughts',
            type: 'tool-result',
          },
        ],
        role: 'tool',
      },
      {
        content: [
          {
            args: {
              files: [
                {
                  name: 'Mountain-500 Online Sales to NA Customers with ColonialVoice Card',
                  yml_content:
                    "name: Mountain-500 Online Sales to NA Customers with ColonialVoice Card\ndescription: Total number of Mountain-500 series bikes sold online to North American customers using ColonialVoice credit cards\ntimeFrame: All time\nsql: |\n  SELECT \n    SUM(sod.orderqty) as total_bikes_sold\n  FROM postgres.ont_ont.sales_order_header soh\n  INNER JOIN postgres.ont_ont.sales_order_detail sod ON soh.salesorderid = sod.salesorderid\n  INNER JOIN postgres.ont_ont.product p ON sod.productid = p.productid\n  INNER JOIN postgres.ont_ont.credit_card cc ON soh.creditcardid = cc.creditcardid\n  INNER JOIN postgres.ont_ont.customer c ON soh.customerid = c.customerid\n  INNER JOIN postgres.ont_ont.sales_territory st ON c.territoryid = st.territoryid\n  INNER JOIN postgres.ont_ont.country_region cr ON st.countryregioncode = cr.countryregioncode\n  WHERE soh.onlineorderflag = true\n    AND p.name ILIKE '%Mountain-500%'\n    AND p.finishedgoodsflag = true\n    AND cc.cardtype = 'ColonialVoice'\n    AND cr.countryregioncode IN ('US', 'CA', 'MX')\nchartConfig:\n  selectedChartType: metric\n  columnLabelFormats:\n    total_bikes_sold:\n      columnType: number\n      style: number\n      replaceMissingDataWith: 0\n      numberSeparatorStyle: ','\n      displayName: Total Bikes Sold\n  metricColumnId: total_bikes_sold\n  metricValueAggregate: sum\n  metricHeader: Mountain-500 Series Bikes\n  metricSubHeader: Online Sales to NA Customers (ColonialVoice Card)\n  metricValueLabel: Bikes Sold",
                },
              ],
            },
            toolCallId: 'toolu_05JTGAQ7Pz8gT3SnRaUZttdF',
            toolName: 'createMetrics',
            type: 'tool-call',
          },
        ],
        role: 'assistant',
      },
      {
        content: [
          {
            result: {
              duration: 674,
              failed_files: [],
              files: [
                {
                  created_at: '2025-06-24T22:29:54.034Z',
                  file_type: 'metric',
                  id: 'a4a649b9-c61b-4632-8103-21ae207d4eb8',
                  name: 'Mountain-500 Online Sales to NA Customers with ColonialVoice Card',
                  result_message: 'Query validated successfully and returned 1 records',
                  results: [
                    {
                      total_bikes_sold: '47',
                    },
                  ],
                  updated_at: '2025-06-24T22:29:54.034Z',
                  version_number: 1,
                },
              ],
              message: 'Successfully created 1 metric files.',
            },
            toolCallId: 'toolu_05JTGAQ7Pz8gT3SnRaUZttdF',
            toolName: 'createMetrics',
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

    const mockInput: PostProcessingWorkflowInput = {
      conversationHistory: mockConversationHistory as ModelMessage[],
      userName: 'Test Post-Processing Workflow',
      isFollowUp: false,
      isSlackFollowUp: false,
      datasets:
        'name: product\ndescription: Product catalog information\ntables:\n  - name: product\n    description: Product information including bikes and accessories\n    columns:\n      - name: name\n        description: Product name\n      - name: finishedgoodsflag\n        description: Indicates if finished and ready for sale\n  - name: sales_order_header\n    description: Sales order header information\n    columns:\n      - name: onlineorderflag\n        description: Boolean indicating if order was placed online\n  - name: credit_card\n    description: Credit card information\n    columns:\n      - name: cardtype\n        description: Type of credit card',
    };

    // Execute the workflow
    const result = await runMessagePostProcessingWorkflow(mockInput);

    // Verify the workflow executed successfully
    expect(result).toBeDefined();
    expect(result.flagChatResult).toBeDefined();
    expect(result.assumptionsResult).toBeDefined();
  }, 300000); // 5 minute timeout for full workflow execution
});
