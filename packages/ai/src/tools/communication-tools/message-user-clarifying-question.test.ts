import { describe, expect, test } from 'vitest';
import messageUserClarifyingQuestion from './message-user-clarifying-question';

describe('Message User Clarifying Question Tool Unit Tests', () => {
  test('should have correct configuration', () => {
    expect(messageUserClarifyingQuestion.id).toBe('message-user-clarifying-question');
    expect(messageUserClarifyingQuestion.description).toContain(
      'Ask the user a clarifying question when additional information is needed'
    );
    expect(messageUserClarifyingQuestion.inputSchema).toBeDefined();
    expect(messageUserClarifyingQuestion.outputSchema).toBeDefined();
    expect(messageUserClarifyingQuestion.execute).toBeDefined();
  });

  test('should validate input schema', () => {
    const validInput = {
      clarifying_question: 'Which time period would you like to analyze?',
    };
    const result = messageUserClarifyingQuestion.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate output schema structure', () => {
    const validOutput = {};

    const result = messageUserClarifyingQuestion.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should execute with clarifying question', async () => {
    const result = await messageUserClarifyingQuestion.execute({
      context: {
        clarifying_question: 'Which time period would you like to analyze?',
      },
      runtimeContext: {} as any,
    });

    expect(result).toEqual({});
  });

  test('should require minimum length for clarifying question', () => {
    const invalidInput = {
      clarifying_question: '',
    };
    const result = messageUserClarifyingQuestion.inputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  test('should execute successfully with valid question', async () => {
    const result = await messageUserClarifyingQuestion.execute({
      context: {
        clarifying_question:
          '## Which metric would you like to focus on?\n\n- Revenue: Total sales revenue\n- Profit: Net profit after costs\n- Volume: Number of units sold',
      },
      runtimeContext: {} as any,
    });

    expect(result).toEqual({});
  });
});

describe.skip('Process Clarification Response Tool Tests (SKIPPED - Tool not implemented)', () => {});

describe.skip('Should Ask Clarification Helper Tests (SKIPPED - Helper not implemented)', () => {});
