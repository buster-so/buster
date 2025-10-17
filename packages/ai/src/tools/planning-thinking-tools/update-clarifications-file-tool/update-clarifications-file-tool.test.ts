import { beforeEach, describe, expect, it } from 'vitest';
import type {
  UpdateClarificationsFileToolInput,
  UpdateClarificationsFileToolOutput,
} from './update-clarifications-file-tool';
import { createUpdateClarificationsFileTool } from './update-clarifications-file-tool';

describe('updateClarificationsFile', () => {
  let updateClarificationsFileTool: ReturnType<typeof createUpdateClarificationsFileTool>;
  let clarifications: any[];
  let updateClarificationsCalled: boolean;

  // Helper to call execute with a concrete signature
  const run = async (
    input: UpdateClarificationsFileToolInput
  ): Promise<UpdateClarificationsFileToolOutput> => {
    const exec = updateClarificationsFileTool.execute as (
      i: UpdateClarificationsFileToolInput
    ) => Promise<UpdateClarificationsFileToolOutput>;
    return exec(input);
  };

  beforeEach(() => {
    clarifications = [];
    updateClarificationsCalled = false;
    updateClarificationsFileTool = createUpdateClarificationsFileTool({
      get clarifications() {
        return clarifications;
      },
      updateClarifications: (newClarifications: any[]) => {
        clarifications = newClarifications;
        updateClarificationsCalled = true;
      },
    });
  });

  it('should add a clarification question successfully', async () => {
    const result = await run({
      clarifications: [
        {
          issue: 'Database connection configuration',
          context:
            'The user mentioned they need to connect to a database but did not specify which type',
          clarificationQuestion:
            'Which type of database are you using? (PostgreSQL, MySQL, MongoDB, etc.)',
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.clarifications).toEqual([
      {
        issue: 'Database connection configuration',
        context:
          'The user mentioned they need to connect to a database but did not specify which type',
        clarificationQuestion:
          'Which type of database are you using? (PostgreSQL, MySQL, MongoDB, etc.)',
      },
    ]);
    expect(result.message).toBe('Successfully updated clarification questions');

    // Verify context was updated
    expect(updateClarificationsCalled).toBe(true);
    expect(clarifications).toEqual(result.clarifications);
  });

  it('should overwrite previous clarification when adding new one', async () => {
    // Add first clarification
    await run({
      clarifications: [
        {
          issue: 'First issue',
          context: 'First context',
          clarificationQuestion: 'First question?',
        },
      ],
    });

    // Add second clarification
    const result = await run({
      clarifications: [
        {
          issue: 'Second issue',
          context: 'Second context',
          clarificationQuestion: 'Second question?',
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.clarifications).toEqual([
      {
        issue: 'Second issue',
        context: 'Second context',
        clarificationQuestion: 'Second question?',
      },
    ]);

    // Verify only the second clarification is stored
    expect(clarifications).toEqual(result.clarifications);
  });

  it('should handle very long clarification content', async () => {
    const longText = 'A'.repeat(1000);

    const result = await run({
      clarifications: [
        {
          issue: longText,
          context: longText,
          clarificationQuestion: `${longText}?`,
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.clarifications?.[0]?.issue).toBe(longText);
    expect(result.clarifications?.[0]?.context).toBe(longText);
    expect(result.clarifications?.[0]?.clarificationQuestion).toBe(`${longText}?`);
  });

  it('should handle empty strings', async () => {
    const result = await run({
      clarifications: [
        {
          issue: '',
          context: '',
          clarificationQuestion: '',
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.clarifications).toEqual([
      {
        issue: '',
        context: '',
        clarificationQuestion: '',
      },
    ]);
  });

  it('should handle special characters in clarification content', async () => {
    const result = await run({
      clarifications: [
        {
          issue: 'Issue with "quotes" and \'apostrophes\'',
          context: 'Context with\nnewlines\tand\ttabs',
          clarificationQuestion: 'Question with émojis 🤔 and special chars: <>?/@#$%',
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.clarifications).toEqual([
      {
        issue: 'Issue with "quotes" and \'apostrophes\'',
        context: 'Context with\nnewlines\tand\ttabs',
        clarificationQuestion: 'Question with émojis 🤔 and special chars: <>?/@#$%',
      },
    ]);
  });
});
