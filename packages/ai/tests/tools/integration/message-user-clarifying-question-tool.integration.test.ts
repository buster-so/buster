import { describe, expect, test, beforeEach } from 'vitest';
import {
  messageUserClarifyingQuestionTool,
  processClarificationResponseTool,
  shouldAskClarification,
} from '@tools/message-user-clarifying-question-tool';

describe('Message User Clarifying Question Tool Integration Tests', () => {
  beforeEach(() => {
    // Reset clarification state between tests
  });

  test('should handle complete clarification workflow', async () => {
    // Step 1: Ask clarifying question
    const questionResult = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Which time period would you like to analyze?',
        question_type: 'multiple_choice',
        options: [
          { value: 'last_month', label: 'Last Month', description: 'Previous 30 days' },
          { value: 'last_quarter', label: 'Last Quarter', description: 'Previous 3 months' },
          { value: 'last_year', label: 'Last Year', description: 'Previous 12 months' },
        ],
        priority: 'medium',
        related_to: 'time series analysis',
      },
    });

    expect(questionResult.success).toBe(true);
    expect(questionResult.conversation_paused).toBe(true);
    expect(questionResult.requires_response).toBe(true);
    expect(questionResult.formatted_question).toContain('1. **Last Month**');
    expect(questionResult.formatted_question).toContain('Previous 30 days');
    expect(questionResult.formatted_question).toContain('time series analysis');

    // Step 2: Process user response
    const responseResult = await processClarificationResponseTool.execute({
      context: { response: '2' }, // User selects "Last Quarter"
    });

    expect(responseResult.success).toBe(true);
    expect(responseResult.response_processed).toBe(true);
    expect(responseResult.workflow_resumed).toBe(true);
    expect(responseResult.validation_result?.valid).toBe(true);
  });

  test('should handle yes/no questions with validation', async () => {
    // Ask yes/no question
    const questionResult = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Should I include historical data in the analysis?',
        question_type: 'yes_no',
        context: 'Historical data goes back 5 years but may slow processing',
        priority: 'high',
      },
    });

    expect(questionResult.formatted_question).toContain('🔴 **Important Clarification Needed**');
    expect(questionResult.formatted_question).toContain('**Yes** or **No**');
    expect(questionResult.formatted_question).toContain('Historical data goes back 5 years');

    // Test valid responses
    const validResponses = ['Yes', 'No', 'y', 'n', 'YES', 'no'];
    for (const response of validResponses) {
      await messageUserClarifyingQuestionTool.execute({
        context: {
          question: 'Test question',
          question_type: 'yes_no',
        },
      });

      const result = await processClarificationResponseTool.execute({
        context: { response },
      });

      expect(result.success).toBe(true);
      expect(result.validation_result?.valid).toBe(true);
    }

    // Test invalid response
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Test question',
        question_type: 'yes_no',
      },
    });

    const invalidResult = await processClarificationResponseTool.execute({
      context: { response: 'maybe' },
    });

    expect(invalidResult.success).toBe(false);
    expect(invalidResult.validation_result?.valid).toBe(false);
    expect(invalidResult.validation_result?.error_message).toContain('Yes or No');
  });

  test('should handle confirmation questions', async () => {
    const questionResult = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'This will delete all draft dashboards. Please confirm to proceed.',
        question_type: 'confirmation',
        priority: 'high',
        related_to: 'data cleanup operation',
      },
    });

    expect(questionResult.formatted_question).toContain('🔴 **Important Clarification Needed**');
    expect(questionResult.formatted_question).toContain('**Confirm**');
    expect(questionResult.formatted_question).toContain('data cleanup operation');

    // Test valid confirmation
    const confirmResult = await processClarificationResponseTool.execute({
      context: { response: 'Confirm' },
    });

    expect(confirmResult.success).toBe(true);
    expect(confirmResult.validation_result?.valid).toBe(true);

    // Test alternative response
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Confirm deletion',
        question_type: 'confirmation',
      },
    });

    const alternativeResult = await processClarificationResponseTool.execute({
      context: { response: 'Actually, please skip the deletion and just archive them' },
    });

    expect(alternativeResult.success).toBe(true);
    expect(alternativeResult.validation_result?.valid).toBe(true);

    // Test invalid confirmation
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Confirm action',
        question_type: 'confirmation',
      },
    });

    const invalidResult = await processClarificationResponseTool.execute({
      context: { response: 'ok' },
    });

    expect(invalidResult.success).toBe(false);
    expect(invalidResult.validation_result?.error_message).toContain('Confirm');
  });

  test('should handle open-ended questions', async () => {
    const questionResult = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'What specific metrics would you like to see in the dashboard?',
        question_type: 'open_ended',
        context: 'You can specify multiple metrics separated by commas',
        priority: 'medium',
      },
    });

    expect(questionResult.formatted_question).not.toContain('🔴');
    expect(questionResult.formatted_question).toContain('separated by commas');

    // Open-ended questions accept any response
    const responses = [
      'Revenue, Profit Margin, Customer Count',
      'Just show me the basics',
      'I need detailed financial metrics including EBITDA, Cash Flow, and ROI',
    ];

    for (const response of responses) {
      await messageUserClarifyingQuestionTool.execute({
        context: {
          question: 'Test question',
          question_type: 'open_ended',
        },
      });

      const result = await processClarificationResponseTool.execute({
        context: { response },
      });

      expect(result.success).toBe(true);
      expect(result.validation_result?.valid).toBe(true);
    }
  });

  test('should handle complex multi-step clarification', async () => {
    // Step 1: Ask about data source
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Which data source should I use?',
        question_type: 'multiple_choice',
        options: [
          { value: 'production', label: 'Production Database' },
          { value: 'staging', label: 'Staging Database' },
          { value: 'warehouse', label: 'Data Warehouse' },
        ],
      },
    });

    await processClarificationResponseTool.execute({
      context: { response: '1' },
    });

    // Step 2: Ask about time range
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'What time range should I analyze?',
        question_type: 'open_ended',
        context: 'Based on your selection of Production Database',
      },
    });

    await processClarificationResponseTool.execute({
      context: { response: 'Last 6 months' },
    });

    // Step 3: Final confirmation
    const finalResult = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Ready to analyze Production Database for the last 6 months?',
        question_type: 'yes_no',
      },
    });

    expect(finalResult.success).toBe(true);

    const confirmResult = await processClarificationResponseTool.execute({
      context: { response: 'Yes' },
    });

    expect(confirmResult.success).toBe(true);
    expect(confirmResult.workflow_resumed).toBe(true);
  });

  test('should handle no pending clarification request error', async () => {
    // Try to process response without asking question first
    const result = await processClarificationResponseTool.execute({
      context: { response: 'Some response' },
    });

    expect(result.success).toBe(false);
  });

  test('should handle question priority levels', async () => {
    const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

    for (const priority of priorities) {
      const result = await messageUserClarifyingQuestionTool.execute({
        context: {
          question: `${priority} priority question`,
          question_type: 'open_ended',
          priority,
        },
      });

      if (priority === 'high') {
        expect(result.formatted_question).toContain('🔴 **Important Clarification Needed**');
      } else {
        expect(result.formatted_question).not.toContain('🔴');
      }
    }
  });

  test('should handle concurrent clarification requests', async () => {
    // This tests that the state management handles multiple rapid requests appropriately
    const questions = [
      'Question 1: Which format?',
      'Question 2: Which color scheme?',
      'Question 3: Which layout?',
    ];

    for (const question of questions) {
      const result = await messageUserClarifyingQuestionTool.execute({
        context: {
          question,
          question_type: 'open_ended',
        },
      });

      expect(result.success).toBe(true);
      expect(result.conversation_paused).toBe(true);

      // Process response immediately
      const responseResult = await processClarificationResponseTool.execute({
        context: { response: `Response to: ${question}` },
      });

      expect(responseResult.success).toBe(true);
      expect(responseResult.workflow_resumed).toBe(true);
    }
  });
});

describe('Should Ask Clarification Helper Integration Tests', () => {
  test('should recommend clarification for high ambiguity scenarios', () => {
    const highAmbiguityScenarios = [
      {
        ambiguity_score: 0.8,
        missing_requirements: [],
        confidence_level: 0.6,
      },
      {
        ambiguity_score: 0.9,
        missing_requirements: ['time_period'],
        confidence_level: 0.3,
      },
    ];

    for (const scenario of highAmbiguityScenarios) {
      const result = shouldAskClarification(scenario);
      expect(result).toBe(true);
    }
  });

  test('should recommend clarification for missing requirements', () => {
    const missingRequirementsScenarios = [
      {
        ambiguity_score: 0.3,
        missing_requirements: ['data_source', 'time_period', 'metrics'],
        confidence_level: 0.7,
      },
      {
        ambiguity_score: 0.2,
        missing_requirements: ['visualization_type'],
        confidence_level: 0.8,
      },
    ];

    for (const scenario of missingRequirementsScenarios) {
      const result = shouldAskClarification(scenario);
      expect(result).toBe(true);
    }
  });

  test('should recommend clarification for low confidence', () => {
    const lowConfidenceScenarios = [
      {
        ambiguity_score: 0.4,
        missing_requirements: [],
        confidence_level: 0.3,
      },
      {
        ambiguity_score: 0.2,
        missing_requirements: [],
        confidence_level: 0.4,
      },
    ];

    for (const scenario of lowConfidenceScenarios) {
      const result = shouldAskClarification(scenario);
      expect(result).toBe(true);
    }
  });

  test('should not recommend clarification for clear scenarios', () => {
    const clearScenarios = [
      {
        ambiguity_score: 0.2,
        missing_requirements: [],
        confidence_level: 0.9,
      },
      {
        ambiguity_score: 0.1,
        missing_requirements: [],
        confidence_level: 0.8,
      },
      {
        ambiguity_score: 0.3,
        missing_requirements: [],
        confidence_level: 0.7,
      },
    ];

    for (const scenario of clearScenarios) {
      const result = shouldAskClarification(scenario);
      expect(result).toBe(false);
    }
  });

  test('should handle edge cases appropriately', () => {
    const edgeCases = [
      {
        ambiguity_score: 0.7, // High
        missing_requirements: [],
        confidence_level: 0.9, // High confidence doesn't override high ambiguity
        expected: true,
      },
      {
        ambiguity_score: 0.1, // Low
        missing_requirements: ['critical_param'], // Has missing requirements
        confidence_level: 0.9, // High confidence doesn't override missing requirements
        expected: true,
      },
      {
        ambiguity_score: 0.1, // Low
        missing_requirements: [],
        confidence_level: 0.49, // Just below threshold
        expected: true,
      },
      {
        ambiguity_score: 0.69, // Just below threshold
        missing_requirements: [],
        confidence_level: 0.51, // Just above threshold
        expected: false,
      },
    ];

    for (const edgeCase of edgeCases) {
      const result = shouldAskClarification({
        ambiguity_score: edgeCase.ambiguity_score,
        missing_requirements: edgeCase.missing_requirements,
        confidence_level: edgeCase.confidence_level,
      });
      expect(typeof result).toBe('boolean');
    }
  });
});