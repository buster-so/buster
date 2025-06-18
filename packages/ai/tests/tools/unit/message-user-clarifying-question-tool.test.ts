import {
  messageUserClarifyingQuestionTool,
  processClarificationResponseTool,
  shouldAskClarification,
} from '../../../src/tools/communication-tools/message-user-clarifying-question-tool';
import { describe, expect, test } from 'vitest';

describe('Message User Clarifying Question Tool Unit Tests', () => {
  test('should have correct configuration', () => {
    expect(messageUserClarifyingQuestionTool.id).toBe('message-user-clarifying-question');
    expect(messageUserClarifyingQuestionTool.description).toBe(
      'Ask the user a clarifying question when requirements are unclear'
    );
    expect(messageUserClarifyingQuestionTool.inputSchema).toBeDefined();
    expect(messageUserClarifyingQuestionTool.outputSchema).toBeDefined();
    expect(messageUserClarifyingQuestionTool.execute).toBeDefined();
  });

  test('should validate input schema', () => {
    const validInput = {
      question: 'Which time period would you like to analyze?',
      context: 'Multiple time periods are available in the data',
      question_type: 'open_ended' as const,
      priority: 'medium' as const,
    };
    const result = messageUserClarifyingQuestionTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate output schema structure', () => {
    const validOutput = {
      success: true,
      message_sent: true,
      formatted_question: 'Which time period would you like to analyze?',
      requires_response: true,
      conversation_paused: true,
    };

    const result = messageUserClarifyingQuestionTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should format open-ended question correctly', async () => {
    const result = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Which time period would you like to analyze?',
        context: 'Multiple time periods are available in the data',
        question_type: 'open_ended',
      },
    });

    expect(result.success).toBe(true);
    expect(result.formatted_question).toContain('Which time period');
    expect(result.formatted_question).toContain('Context:');
    expect(result.conversation_paused).toBe(true);
    expect(result.requires_response).toBe(true);
  });

  test('should format multiple choice question with options', async () => {
    const result = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Which metric would you like to focus on?',
        question_type: 'multiple_choice',
        options: [
          { value: 'revenue', label: 'Revenue', description: 'Total sales revenue' },
          { value: 'profit', label: 'Profit', description: 'Net profit after costs' },
          { value: 'volume', label: 'Volume', description: 'Number of units sold' },
        ],
      },
    });

    expect(result.success).toBe(true);
    expect(result.formatted_question).toContain('1. **Revenue**');
    expect(result.formatted_question).toContain('Total sales revenue');
    expect(result.formatted_question).toContain('2. **Profit**');
    expect(result.formatted_question).toContain('3. **Volume**');
  });

  test('should format yes/no question correctly', async () => {
    const result = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Should I include historical data?',
        question_type: 'yes_no',
      },
    });

    expect(result.success).toBe(true);
    expect(result.formatted_question).toContain('Should I include historical data?');
    expect(result.formatted_question).toContain('**Yes** or **No**');
  });

  test('should format confirmation question correctly', async () => {
    const result = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Please confirm before proceeding with data deletion',
        question_type: 'confirmation',
      },
    });

    expect(result.success).toBe(true);
    expect(result.formatted_question).toContain('data deletion');
    expect(result.formatted_question).toContain('**Confirm**');
  });

  test('should handle high priority questions', async () => {
    const result = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Please confirm before proceeding with data deletion',
        question_type: 'confirmation',
        priority: 'high',
      },
    });

    expect(result.success).toBe(true);
    expect(result.formatted_question).toContain('🔴 **Important Clarification Needed**');
  });

  test('should include related context', async () => {
    const result = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Which format should I use?',
        question_type: 'open_ended',
        related_to: 'data export functionality',
      },
    });

    expect(result.success).toBe(true);
    expect(result.formatted_question).toContain('related to: data export functionality');
  });

  test('should handle medium and low priority questions', async () => {
    const mediumResult = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Which chart type?',
        priority: 'medium',
      },
    });

    const lowResult = await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Which color scheme?',
        priority: 'low',
      },
    });

    expect(mediumResult.formatted_question).not.toContain('🔴');
    expect(lowResult.formatted_question).not.toContain('🔴');
  });
});

describe('Process Clarification Response Tool Tests', () => {
  test('should have correct configuration', () => {
    expect(processClarificationResponseTool.id).toBe('process-clarification-response');
    expect(processClarificationResponseTool.description).toBe(
      'Process user response to a clarifying question'
    );
  });

  test('should validate input schema', () => {
    const validInput = {
      response: 'Yes, include historical data',
      question_id: 'clarify_123',
    };
    const result = processClarificationResponseTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should process valid yes/no response', async () => {
    // First ask a yes/no question
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Should I include historical data?',
        question_type: 'yes_no',
      },
    });

    // Then process the response
    const result = await processClarificationResponseTool.execute({
      context: { response: 'Yes' },
    });

    expect(result.success).toBe(true);
    expect(result.response_processed).toBe(true);
    expect(result.workflow_resumed).toBe(true);
    expect(result.validation_result?.valid).toBe(true);
  });

  test('should reject invalid yes/no response', async () => {
    // First ask a yes/no question
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Should I proceed?',
        question_type: 'yes_no',
      },
    });

    // Then process invalid response
    const result = await processClarificationResponseTool.execute({
      context: { response: 'Maybe' },
    });

    expect(result.success).toBe(false);
    expect(result.response_processed).toBe(false);
    expect(result.workflow_resumed).toBe(false);
    expect(result.validation_result?.valid).toBe(false);
    expect(result.validation_result?.error_message).toContain('Yes or No');
  });

  test('should process valid confirmation response', async () => {
    // First ask a confirmation question
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Please confirm the data deletion',
        question_type: 'confirmation',
      },
    });

    // Then process confirmation
    const result = await processClarificationResponseTool.execute({
      context: { response: 'Confirm' },
    });

    expect(result.success).toBe(true);
    expect(result.validation_result?.valid).toBe(true);
  });

  test('should reject invalid confirmation response', async () => {
    // First ask a confirmation question
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Please confirm the action',
        question_type: 'confirmation',
      },
    });

    // Then process short/invalid response
    const result = await processClarificationResponseTool.execute({
      context: { response: 'ok' },
    });

    expect(result.success).toBe(false);
    expect(result.validation_result?.error_message).toContain('Confirm');
  });

  test('should process open-ended responses', async () => {
    // First ask an open-ended question
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'What time period would you like?',
        question_type: 'open_ended',
      },
    });

    // Then process any response (open-ended doesn't validate)
    const result = await processClarificationResponseTool.execute({
      context: { response: 'Last 3 months' },
    });

    expect(result.success).toBe(true);
    expect(result.validation_result?.valid).toBe(true);
  });

  test('should handle no pending clarification request', async () => {
    // Try to process response without asking question first
    const result = await processClarificationResponseTool.execute({
      context: { response: 'Some response' },
    });

    // The tool may handle this gracefully rather than throwing
    expect(result.success).toBe(true);
    expect(result.response_processed).toBe(true);
  });
});

describe('Should Ask Clarification Helper Tests', () => {
  test('should ask clarification for high ambiguity', () => {
    const result = shouldAskClarification({
      ambiguity_score: 0.8,
      missing_requirements: [],
      confidence_level: 0.7,
    });

    expect(result).toBe(true);
  });

  test('should ask clarification for missing requirements', () => {
    const result = shouldAskClarification({
      ambiguity_score: 0.3,
      missing_requirements: ['time_period', 'metrics'],
      confidence_level: 0.7,
    });

    expect(result).toBe(true);
  });

  test('should ask clarification for low confidence', () => {
    const result = shouldAskClarification({
      ambiguity_score: 0.3,
      missing_requirements: [],
      confidence_level: 0.4,
    });

    expect(result).toBe(true);
  });

  test('should not ask clarification when all conditions are good', () => {
    const result = shouldAskClarification({
      ambiguity_score: 0.2,
      missing_requirements: [],
      confidence_level: 0.8,
    });

    expect(result).toBe(false);
  });

  test('should ask clarification when multiple conditions are borderline', () => {
    const result = shouldAskClarification({
      ambiguity_score: 0.6,
      missing_requirements: ['time_period'],
      confidence_level: 0.6,
    });

    expect(result).toBe(true);
  });
});
