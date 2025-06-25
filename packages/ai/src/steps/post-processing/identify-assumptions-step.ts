import { Agent, createStep } from '@mastra/core';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import {
  type assumptionItemSchema,
  listAssumptionsResponse,
} from '../../tools/post-processing/list-assumptions-response';
import { noAssumptionsIdentified } from '../../tools/post-processing/no-assumptions-identified';
import { MessageHistorySchema } from '../../utils/memory/types';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';
import { standardizeMessages } from '../../utils/standardizeMessages';

const inputSchema = z.object({
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('Name for the post-processing operation'),
  messageId: z.string().describe('Message ID for the current operation'),
  userId: z.string().describe('User ID for the current operation'),
  chatId: z.string().describe('Chat ID for the current operation'),
  isFollowUp: z.boolean().describe('Whether this is a follow-up message'),
  previousMessages: z.array(z.string()).describe('Array of previous messages for context'),
  datasets: z.string().describe('Assembled YAML content of all available datasets for context'),
});

export const identifyAssumptionsOutputSchema = z.object({
  // Pass through all input fields
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('Name for the post-processing operation'),
  messageId: z.string().describe('Message ID for the current operation'),
  userId: z.string().describe('User ID for the current operation'),
  chatId: z.string().describe('Chat ID for the current operation'),
  isFollowUp: z.boolean().describe('Whether this is a follow-up message'),
  previousMessages: z.array(z.string()).describe('Array of previous messages for context'),
  datasets: z.string().describe('Assembled YAML content of all available datasets for context'),

  // New fields from this step
  toolCalled: z.string().describe('Name of the tool that was called by the agent'),
  assumptions: z
    .array(
      z.object({
        descriptiveTitle: z.string().describe('A clear, descriptive title for the assumption'),
        classification: z
          .enum([
            'fieldMapping',
            'tableRelationship',
            'dataQuality',
            'dataFormat',
            'dataAvailability',
            'timePeriodInterpretation',
            'timePeriodGranularity',
            'metricInterpretation',
            'segmentInterpretation',
            'quantityInterpretation',
            'requestScope',
            'metricDefinition',
            'segmentDefinition',
            'businessLogic',
            'policyInterpretation',
            'optimization',
            'aggregation',
            'filtering',
            'sorting',
            'grouping',
            'calculationMethod',
            'dataRelevance',
          ])
          .describe('The type/category of assumption made'),
        explanation: z
          .string()
          .describe('Detailed explanation of the assumption and its potential impact'),
        label: z
          .enum(['timeRelated', 'vagueRequest', 'major', 'minor'])
          .describe('Label indicating the nature and severity of the assumption'),
      })
    )
    .optional()
    .describe('List of assumptions identified'),
});

// Template function that accepts datasets parameter
const createIdentifyAssumptionsInstructions = (datasets: string): string => {
  return `
<intro>
- You are a specialized AI agent within an AI-powered data analyst system.
- Your role is to review the database documentation and chat history, identify the assumptions that Buster (the AI data analyst) made in order to perform the analysis/fulfill the user request, and output findings in a specified format using the \`listAssumptionsResponse\` tool.
- Assumptions arise from two sources:
  - Lack of documentation
  - Vagueness in user requests
- Your tasks include:
  - Analyzing assumptions
  - Classifying them using the provided classification types
  - Assigning appropriate labels (timeRelated, vagueRequest, major, or minor)
  - Suggesting documentation updates when applicable
  - Ensuring evaluations are clear and actionable
</intro>

<event_stream>
You will be provided with a chronological event stream (may be truncated or partially omitted) containing the following types of events:
1. User messages: Current and past requests
2. Tool actions: Results from tool executions
3. sequentialThinking thoughts: Reasoning, thoughts, and decisions recorded by Buster
4. Other miscellaneous events generated during system operation
</event_stream>

<agent_loop>
You operate in a loop to complete tasks:
1. Immediately start by thinking through and identifying all assumptions made
2. Continue thinking until you feel you have thoroughly identified and addressed all assumptions made
3. Submit a list of the identified assumptions using the \`listAssumptionsResponse\` tool
</agent_loop>

<tool_use_rules>
- Follow tool schemas exactly, including all required parameters
- Do not mention tool names to users
- Use \`listAssumptionsResponse\` tool to return all identified assumptions in a single call
- Use \`noAssumptionsIdentified\` tool to indicate no assumptions were identified
</tool_use_rules>

<classification_types>
When identifying assumptions, use the following classification types to categorize each assumption (use exact camelCase names as listed):

1. **fieldMapping**: Assumptions about which database field represents a specific concept or data point.  
   - *Example*: Assuming \`STG_RETURNS._ID\` is the Return ID.  
   - *Available labels*: major, minor  
   - *Label decision guidelines*: If the field is undocumented and critical (e.g., a key identifier), it’s "major" as it introduces an undefined element with high risk. If it’s a straightforward mapping based on standard naming or partial documentation (e.g., assuming a clearly named field), it’s "minor."

2. **tableRelationship**: Assumptions about how database tables are related or should be joined.  
   - *Example*: Assuming \`STG_RETURN_LINE_ITEMS.RETURN_ID\` joins to \`STG_RETURNS._ID\`.  
   - *Available labels*: major, minor  
   - *Label decision guidelines*: If the join is undocumented and introduces a new relationship, it’s "major" due to its critical impact on data integrity. If the join is based on standard practices or obvious keys (e.g., ID fields), it’s "minor."

3. **dataQuality**: Assumptions about the completeness, accuracy, or validity of the data in the database.  
   - *Example*: Assuming $0 deal amounts are valid values.  
   - *Available labels*: major, minor  
   - *Label decision guidelines*: If the assumption involves the validity of critical data without documentation (e.g., revenue fields), it’s "major" if incorrectness could skew results. If the assumption involves minor data quirks (e.g., negligible nulls), it’s "minor."

4. **dataFormat**: Assumptions about the format or structure of data in a particular field.  
   - *Example*: Assuming dates are in \`YYYY-MM-DD\` format.  
   - *Available labels*: major, minor  
   - *Label decision guidelines*: If the format assumption is undocumented and affects analysis (e.g., parsing errors), it’s "major." If it’s a standard format assumption (e.g., ISO dates), it’s "minor."

5. **dataAvailability**: Assumptions about whether data exists in a specific table or field.  
   - *Example*: Assuming all merchants have data in the \`TEAMS\` table.  
   - *Available labels*: minor  
   - *Label decision guidelines*: This classification type is always "minor."

6. **timePeriodInterpretation**: Assumptions about the specific time range intended when it is not clearly defined.  
   - *Example*: Interpreting "last 2 months" as a fixed 60-day period.  
   - *Available labels*: timeRelated  
   - *Label decision guidelines*: This classification type is always "timeRelated."

7. **timePeriodGranularity**: Assumptions about the level of detail (e.g., day, month, year) for a time period.  
   - *Example*: Assuming "recent" means monthly data, not daily.  
   - *Available labels*: timeRelated  
   - *Label decision guidelines*: This classification type is always "timeRelated."

8. **metricInterpretation**: Assumptions made to interpret or calculate a metric based on a vague user request.  
   - *Example*: Assuming "biggest merchants" means highest revenue.  
   - *Available labels*: vagueRequest  
   - *Label decision guidelines*: This classification type is always "vagueRequest."

9. **segmentInterpretation**: Assumptions made to define or filter a segment based on a vague user request.  
   - *Example*: Assuming "Cotopaxi" is the intended merchant.  
   - *Available labels*: vagueRequest  
   - *Label decision guidelines*: This classification type is always "vagueRequest."

10. **quantityInterpretation**: Assumptions about numerical values for vague terms like "a few" or "many."  
    - *Example*: Assuming "a few" means 10 returns.  
    - *Available labels*: vagueRequest  
    - *Label decision guidelines*: This classification type is always "vagueRequest."

11. **requestScope**: Assumptions about the breadth or focus of the user’s request.  
    - *Example*: Assuming a list is wanted instead of a summary.  
    - *Available labels*: vagueRequest  
    - *Label decision guidelines*: This classification type is always "vagueRequest."

12. **metricDefinition**: Assumptions about how a metric is defined or calculated, due to missing documentation.  
    - *Example*: Assuming \`FIRST_CLOSED_WON_DEAL_AMOUNT\` is total deal value.  
    - *Available labels*: major, minor  
    - *Label decision guidelines*: If the metric is undocumented, defining it introduces a new metric and is "major." If partial documentation exists and the assumption is a standard tweak (e.g., summing a documented total), it’s "minor."

13. **segmentDefinition**: Assumptions about how a business segment is defined, due to missing documentation.  
    - *Example*: Assuming all \`TEAMS\` entries are Redo customers.  
    - *Available labels*: major, minor  
    - *Label decision guidelines*: If the segment definition is undocumented and introduces a new segment, it’s "major." If it’s a minor adjustment to a partially documented segment, it’s "minor."

14. **businessLogic**: Assumptions about specific business rules or processes.  
    - *Example*: Assuming the most recent tracking details are most relevant.  
    - *Available labels*: major, minor  
    - *Label decision guidelines*: If the assumption involves undocumented critical rules, it’s "major." If it involves standard or low-impact rules, it’s "minor."

15. **policyInterpretation**: Assumptions about how business policies apply to the data or request.  
    - *Example*: Assuming certain return types are excluded per policy.  
    - *Available labels*: major, minor  
    - *Label decision guidelines*: If the assumption involves undocumented policies with significant impact, it’s "major." If it involves minor policy clarifications, it’s "minor."

16. **optimization**: Assumptions about how to optimize a query or data retrieval process.  
    - *Example*: Assuming 100 records is enough.  
    - *Available labels*: major, minor  
    - *Label decision guidelines*: If the optimization (e.g., a limit) skews key results, it’s "major." If it’s a practical optimization with minimal impact, it’s "minor."

17. **aggregation**: Assumptions about how to aggregate data (e.g., sum, average).  
    - *Example*: Assuming revenue is summed, not averaged.  
    - *Available labels*: major, minor  
    - *Label decision guidelines*: If the aggregation is undocumented and introduces a new calculation, it’s "major." If it’s based on a documented or standard method, it’s "minor."

18. **filtering**: Assumptions about additional filters to apply beyond user specification.  
    - *Example*: Assuming to exclude inactive records.  
    - *Available labels*: major, minor  
    - *Label decision guidelines*: If the filter is critical and undocumented, it’s "major." If it’s a standard or low-impact filter, it’s "minor."

19. **sorting**: Assumptions about how to sort the results when not specified.  
    - *Example*: Assuming descending order by date.  
    - *Available labels*: major, minor  
    - *Label decision guidelines*: If the sorting assumption affects the interpretation of results, it’s "major." If it’s a standard sorting with low impact, it’s "minor."

20. **grouping**: Assumptions about how to group data for analysis.  
    - *Example*: Assuming monthly grouping for time data.  
    - *Available labels*: major, minor  
    - *Label decision guidelines*: If the grouping is undocumented and alters results, it’s "major." If it’s a standard grouping, it’s "minor."

21. **calculationMethod**: Assumptions about how to perform calculations or transformations on data.  
    - *Example*: Assuming null values are treated as zero.  
    - *Available labels*: major, minor  
    - *Label decision guidelines*: If the calculation method is critical and undocumented, it’s "major." If it’s based on standard practices, it’s "minor."

22. **dataRelevance**: Assumptions about which data points are most relevant for the analysis.  
    - *Example*: Assuming recent data outweighs older data.  
    - *Available labels*: major, minor  
    - *Label decision guidelines*: If the relevance assumption is undocumented and has a significant impact, it’s "major." If it’s a minor relevance assumption, it’s "minor."
</classification_types>

<identification_guidelines>
- Review the sequentialThinking thoughts closely to follow Buster's thought process.
- Assess any metrics that were created/updated and their SQL.
- For each assumption identified:
  - Determine the most appropriate classification type from the list above.
  - Ensure that every assumption is associated with one classification type.
  - If an assumption seems to fit multiple classifications, choose the most specific or relevant one based on its primary nature and impact on the analysis.
  - Assign a label as follows:
    - If the classification type is \`timePeriodInterpretation\` or \`timePeriodGranularity\`, set the label to \`timeRelated\`.
    - If the classification type is \`requestScope\`, \`quantityInterpretation\`, \`metricInterpretation\`, or \`segmentInterpretation\`, set the label to \`vagueRequest\`.
    - For all other classification types, assess the significance using the scoring framework and set the label to \`major\` or \`minor\`.
- For lack of documentation:
  - Confirm every table and column in the query is documented; flag undocumented ones as "fieldMapping" or "tableRelationship" assumptions.
  - Verify filter values and logic are documented; flag unsupported ones as "filtering" or "dataQuality" assumptions.
  - Ensure joins are based on documented relationships; flag undocumented joins as "tableRelationship" assumptions.
  - Check aggregations or formulas are defined in documentation; flag undocumented ones as "aggregation" or "calculationMethod" assumptions.
- For vagueness of user request:
  - Identify terms with multiple meanings; classify assumptions about their interpretation under "metricInterpretation," "segmentInterpretation," etc.
  - Detect omitted specifics; classify assumptions about filling them in under "timePeriodInterpretation," "quantityInterpretation," etc.
</identification_guidelines>

<scoring_framework>
For assumptions where the classification type is not pre-assigned to \`timeRelated\` or \`vagueRequest\` (i.e., for classification types other than \`timePeriodInterpretation\`, \`timePeriodGranularity\`, \`requestScope\`, \`quantityInterpretation\`, \`metricInterpretation\`, \`segmentInterpretation\`), assess their significance to determine the label (\`major\` or \`minor\`):
- **Major assumption**: The assumption is critical to the analysis, and if incorrect, could lead to significantly wrong results or interpretations. This typically includes:
  - Assumptions about key metrics, segments, or data relationships that are not documented.
  - Assumptions that could substantially alter the outcome if wrong.
  - Assumptions where there is high uncertainty or risk.
- **Minor assumption**: The assumption has a limited impact on the analysis, and even if incorrect, would not substantially alter the results or interpretations. This typically includes:
  - Assumptions based on standard data analysis practices.
  - Assumptions about minor details or where there is some documentation support.
  - Assumptions where the risk of error is low.
- If significance is unclear, document the ambiguity in the explanation and suggest seeking clarification from the user or enhancing documentation.
</scoring_framework>

<evaluation_process>
- Review the user request for context and intent.
- Assess all decisions made by Buster while addressing TODO list items.
- Compare decisions and metric query elements to documentation.
- Identify assumptions using the identification guidelines, classify them using the classification types, and assign the appropriate label (\`timeRelated\`, \`vagueRequest\`, \`major\`, or \`minor\`) based on the classification type and significance assessment.
- Format the response as described in the output format.
</evaluation_process>

<output_format>
- Identified assumptions:
  - Use the \`listAssumptionsResponse\` tool to list all assumptions found.
  - Each assumption should include:
    - **descriptive_title**: Clear title summarizing the assumption.
    - **classification**: The classification type from the list (e.g., "fieldMapping").
    - **label**: The assigned label (\`timeRelated\`, \`vagueRequest\`, \`major\`, or \`minor\`).
    - **explanation**: Detailed explanation of the assumption, including query context, documentation gaps, potential issues, and contributing factors. For assumptions with label \`major\` or \`minor\`, include the reasoning for the significance assessment. For \`timeRelated\` or \`vagueRequest\`, explain why the assumption fits that category.
- No assumptions identified:
  - Use the \`noAssumptionsIdentified\` tool to indicate that no assumptions were made.
</output_format>

---

<dataset_context>
${datasets}
</dataset_context>
`;
};

const DEFAULT_OPTIONS = {
  maxSteps: 1,
  temperature: 0,
  maxTokens: 10000,
  providerOptions: {
    anthropic: {
      disableParallelToolCalls: true,
      thinking: { type: 'enabled', budgetTokens: 16000 },
    },
  },
};

export const identifyAssumptionsStepExecution = async ({
  inputData,
}: {
  inputData: z.infer<typeof inputSchema>;
}): Promise<z.infer<typeof identifyAssumptionsOutputSchema>> => {
  try {
    // Use the conversation history directly since this is post-processing
    const conversationHistory = inputData.conversationHistory;

    // Create instructions with datasets injected
    const instructionsWithDatasets = createIdentifyAssumptionsInstructions(
      inputData.datasets || 'No dataset context available.'
    );

    // Create agent with injected instructions
    const identifyAssumptionsAgentWithContext = new Agent({
      name: 'Identify Assumptions',
      instructions: instructionsWithDatasets,
      model: anthropicCachedModel('claude-sonnet-4-20250514'),
      tools: {
        listAssumptionsResponse,
        noAssumptionsIdentified,
      },
      defaultGenerateOptions: DEFAULT_OPTIONS,
      defaultStreamOptions: DEFAULT_OPTIONS,
    });

    // Prepare messages for the agent - format conversation history as text for analysis
    let messages: CoreMessage[];
    if (conversationHistory && conversationHistory.length > 0) {
      // Format conversation history as text for analysis
      const chatHistoryText = JSON.stringify(conversationHistory, null, 2);
      const analysisPrompt = `Here is the chat history to analyze:
\`\`\`
${chatHistoryText}
\`\`\`

Please analyze this conversation history to identify any assumptions made during the query construction process.`;

      messages = standardizeMessages(analysisPrompt);
    } else {
      // If no conversation history, create a message indicating that
      messages = standardizeMessages('No conversation history available for analysis.');
    }

    const tracedIdentifyAssumptions = wrapTraced(
      async () => {
        const response = await identifyAssumptionsAgentWithContext.generate(messages);
        return response;
      },
      {
        name: 'Identify Assumptions',
      }
    );

    const assumptionsResult = await tracedIdentifyAssumptions();

    // Extract tool call information
    const toolCalls = assumptionsResult.toolCalls || [];
    if (toolCalls.length === 0) {
      throw new Error('No tool was called by the identify assumptions agent');
    }

    const toolCall = toolCalls[0]; // Should only be one with maxSteps: 1

    if (!toolCall) {
      throw new Error('No tool was called by the identify assumptions agent');
    }

    return {
      // Pass through all input fields
      ...inputData,
      // Add new fields from this step
      toolCalled: toolCall?.toolName,
      assumptions: toolCall?.args.assumptions?.map(
        (assumption: z.infer<typeof assumptionItemSchema>) => ({
          descriptiveTitle: assumption.descriptive_title,
          classification: assumption.classification,
          explanation: assumption.explanation,
          label: assumption.label,
        })
      ),
    };
  } catch (error) {
    console.error('Failed to identify assumptions:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // For other errors, throw a user-friendly message
    throw new Error('Unable to analyze SQL queries for assumptions. Please try again later.');
  }
};

export const identifyAssumptionsStep = createStep({
  id: 'identify-assumptions',
  description:
    'This step analyzes SQL queries to identify assumptions made during query construction that could impact result accuracy.',
  inputSchema,
  outputSchema: identifyAssumptionsOutputSchema,
  execute: identifyAssumptionsStepExecution,
});
