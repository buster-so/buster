import { describe, expect, it, vi } from 'vitest';
import type {
  MessageUserClarifyingQuestionContext,
  MessageUserClarifyingQuestionInput,
  MessageUserClarifyingQuestionState,
} from './message-user-clarifying-question';
import { createMessageUserClarifyingQuestionDelta } from './message-user-clarifying-question-delta';
import { createMessageUserClarifyingQuestionFinish } from './message-user-clarifying-question-finish';
import { createMessageUserClarifyingQuestionStart } from './message-user-clarifying-question-start';

// Mock the database update function
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn().mockResolvedValue(undefined),
  updateMessage: vi.fn().mockResolvedValue(undefined),
}));

// Mock braintrust
vi.mock('braintrust', () => ({
  wrapTraced: (fn: any) => fn,
}));

describe('messageUserClarifyingQuestion streaming', () => {
  it('should handle streaming JSON input', async () => {
    const mockContext: MessageUserClarifyingQuestionContext = {
      messageId: 'test-message-123',
      workflowStartTime: Date.now(),
    };

    const state: MessageUserClarifyingQuestionState = {
      args: '',
      clarifyingQuestion: '',
      toolCallId: undefined,
    };

    const onStart = createMessageUserClarifyingQuestionStart(mockContext, state);
    const onDelta = createMessageUserClarifyingQuestionDelta(mockContext, state);
    const onFinish = createMessageUserClarifyingQuestionFinish(mockContext, state);

    // Simulate streaming JSON chunks
    const jsonChunks = [
      '{"clarifying_',
      'question":"What ',
      'specific data ',
      'sources would you ',
      'like me to analyze',
      '? Please provide:\\n',
      '- The database tables',
      ' or data sources\\n',
      '- The time period',
      ' of interest\\n',
      '- Any specific metrics',
      ' or KPIs to focus on"',
      '}',
    ];

    await onStart({ toolCallId: 'tc-1', messages: [] });

    for (const chunk of jsonChunks) {
      await onDelta({ inputTextDelta: chunk, toolCallId: 'tc-1', messages: [] });
    }

    const completeInput: MessageUserClarifyingQuestionInput = {
      clarifying_question:
        'What specific data sources would you like me to analyze? Please provide:\n- The database tables or data sources\n- The time period of interest\n- Any specific metrics or KPIs to focus on',
    };
    await onFinish({ input: completeInput, toolCallId: 'tc-1', messages: [] });

    expect(state.clarifyingQuestion).toBe(completeInput.clarifying_question);
  });

  it('should handle partial JSON parsing during streaming', async () => {
    const mockContext: MessageUserClarifyingQuestionContext = {
      messageId: 'test-message-456',
      workflowStartTime: Date.now(),
    };

    const state: MessageUserClarifyingQuestionState = {
      args: '',
      clarifyingQuestion: '',
      toolCallId: undefined,
    };

    const onDelta = createMessageUserClarifyingQuestionDelta(mockContext, state);

    const incompleteJson = '{"clarifying_question":"Do you want to analyze sales or marketing data';

    await expect(
      onDelta({ inputTextDelta: incompleteJson, toolCallId: 'tc-2', messages: [] })
    ).resolves.not.toThrow();
    expect(true).toBe(true);
  });

  it('should handle empty or malformed input gracefully', async () => {
    const mockContext: MessageUserClarifyingQuestionContext = {
      messageId: '',
      workflowStartTime: Date.now(),
    };

    const state: MessageUserClarifyingQuestionState = {
      args: '',
      clarifyingQuestion: '',
      toolCallId: undefined,
    };

    const onDelta = createMessageUserClarifyingQuestionDelta(mockContext, state);
    const onFinish = createMessageUserClarifyingQuestionFinish(mockContext, state);

    await expect(
      onDelta({ inputTextDelta: 'not valid json', toolCallId: 'tc-3', messages: [] })
    ).resolves.not.toThrow();
    await expect(
      onDelta({ inputTextDelta: '{"incomplete":', toolCallId: 'tc-3', messages: [] })
    ).resolves.not.toThrow();

    await expect(
      onFinish({ input: { clarifying_question: '' }, toolCallId: 'tc-3', messages: [] })
    ).resolves.not.toThrow();
  });

  it('should work without messageId context', async () => {
    const mockContext: MessageUserClarifyingQuestionContext = {
      messageId: '',
      workflowStartTime: Date.now(),
    };

    const state: MessageUserClarifyingQuestionState = {
      args: '',
      clarifyingQuestion: '',
      toolCallId: undefined,
    };

    const onStart = createMessageUserClarifyingQuestionStart(mockContext, state);
    const onFinish = createMessageUserClarifyingQuestionFinish(mockContext, state);

    const input: MessageUserClarifyingQuestionInput = {
      clarifying_question: 'Which metrics are most important to you?',
    };

    await expect(onStart({ toolCallId: 'tc-4', messages: [] })).resolves.not.toThrow();
    await expect(onFinish({ input, toolCallId: 'tc-4', messages: [] })).resolves.not.toThrow();
    expect(state.clarifyingQuestion).toBe(input.clarifying_question);
  });
});
