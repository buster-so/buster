import type { ToolCallOptions } from 'ai';
import { describe, expect, test, vi } from 'vitest';
import { createRespondWithoutAssetCreationDelta } from './respond-without-asset-creation-delta';
import { createRespondWithoutAssetCreationFinish } from './respond-without-asset-creation-finish';
import { createRespondWithoutAssetCreationStart } from './respond-without-asset-creation-start';
import type {
  RespondWithoutAssetCreationContext,
  RespondWithoutAssetCreationInput,
  RespondWithoutAssetCreationState,
} from './respond-without-asset-creation-tool';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn().mockResolvedValue({ success: true }),
  updateMessage: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Respond Without Asset Creation Tool Streaming Tests', () => {
  const mockContext: RespondWithoutAssetCreationContext = {
    messageId: 'test-message-id-123',
    workflowStartTime: Date.now(),
  };

  describe('createRespondWithoutAssetCreationStart', () => {
    test('should initialize state with entry_id on start', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: undefined,
        args: undefined,
        final_response: undefined,
      };

      const startHandler = createRespondWithoutAssetCreationStart(mockContext, state);
      const options: ToolCallOptions = {
        toolCallId: 'tool-call-123',
        messages: [],
      };

      await startHandler(options);

      expect(state.toolCallId).toBe('tool-call-123');
    });

    test('should handle start without messageId in context', async () => {
      const contextWithoutMessageId: RespondWithoutAssetCreationContext = {
        messageId: 'test-message-id',
        workflowStartTime: Date.now(),
      };
      const state: RespondWithoutAssetCreationState = {
        toolCallId: undefined,
        args: undefined,
        final_response: undefined,
      };

      const startHandler = createRespondWithoutAssetCreationStart(contextWithoutMessageId, state);
      const options: ToolCallOptions = {
        toolCallId: 'tool-call-456',
        messages: [],
      };

      await expect(startHandler(options)).resolves.not.toThrow();
      expect(state.toolCallId).toBe('tool-call-456');
    });

    test('should handle empty messageId gracefully', async () => {
      const contextWithEmptyMessageId: RespondWithoutAssetCreationContext = {
        messageId: '',
        workflowStartTime: Date.now(),
      };
      const state: RespondWithoutAssetCreationState = {
        toolCallId: undefined,
        args: undefined,
        final_response: undefined,
      };

      const startHandler = createRespondWithoutAssetCreationStart(contextWithEmptyMessageId, state);
      const options: ToolCallOptions = {
        toolCallId: 'tool-call-789',
        messages: [],
      };

      await expect(startHandler(options)).resolves.not.toThrow();
      expect(state.toolCallId).toBe('tool-call-789');
    });
  });

  describe('createRespondWithoutAssetCreationDelta', () => {
    test('should accumulate text deltas to args', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: 'test-entry',
        args: '',
        final_response: undefined,
      };

      const deltaHandler = createRespondWithoutAssetCreationDelta(mockContext, state);

      await deltaHandler({
        inputTextDelta: '{"final_',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"final_');

      await deltaHandler({
        inputTextDelta: 'response": "Hello',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"final_response": "Hello');
    });

    test('should extract partial final_response from incomplete JSON', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: 'test-entry',
        args: '',
        final_response: undefined,
      };

      const deltaHandler = createRespondWithoutAssetCreationDelta(mockContext, state);

      await deltaHandler({
        inputTextDelta: '{"final_response": "This is a partial response that is still being',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"final_response": "This is a partial response that is still being');
      expect(state.final_response).toBe('This is a partial response that is still being');
    });

    test('should handle complete JSON in delta', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: 'test-entry',
        args: '',
        final_response: undefined,
      };

      const deltaHandler = createRespondWithoutAssetCreationDelta(mockContext, state);

      await deltaHandler({
        inputTextDelta: '{"final_response": "Complete response message"}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"final_response": "Complete response message"}');
      expect(state.final_response).toBe('Complete response message');
    });

    test('should handle markdown content in final_response', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: 'test-entry',
        args: '',
        final_response: undefined,
      };

      const deltaHandler = createRespondWithoutAssetCreationDelta(mockContext, state);

      const markdownContent = `## Summary

- Point 1
- Point 2

**Bold text**`;
      const jsonInput = JSON.stringify({ final_response: markdownContent });
      await deltaHandler({
        inputTextDelta: jsonInput,
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.final_response).toBe(markdownContent);
    });

    test('should handle escaped characters in JSON', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: 'test-entry',
        args: '',
        final_response: undefined,
      };

      const deltaHandler = createRespondWithoutAssetCreationDelta(mockContext, state);

      await deltaHandler({
        inputTextDelta: '{"final_response": "Line 1\\nLine 2\\n\\"Quoted text\\""}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.final_response).toBe('Line 1\nLine 2\n"Quoted text"');
    });

    test('should not update state when no final_response is extracted', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: 'test-entry',
        args: '',
        final_response: undefined,
      };

      const deltaHandler = createRespondWithoutAssetCreationDelta(mockContext, state);

      await deltaHandler({
        inputTextDelta: '{"other_field": "value"}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"other_field": "value"}');
      expect(state.final_response).toBeUndefined();
    });

    test('should handle empty final_response gracefully', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: 'test-entry',
        args: '',
        final_response: undefined,
      };

      const deltaHandler = createRespondWithoutAssetCreationDelta(mockContext, state);

      await deltaHandler({
        inputTextDelta: '{"final_response": ""}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"final_response": ""}');
      expect(state.final_response).toBeUndefined();
    });

    test('should handle context without messageId', async () => {
      const contextWithoutMessageId: RespondWithoutAssetCreationContext = {
        messageId: 'test-message-id',
        workflowStartTime: Date.now(),
      };
      const state: RespondWithoutAssetCreationState = {
        toolCallId: 'test-entry',
        args: '',
        final_response: undefined,
      };

      const deltaHandler = createRespondWithoutAssetCreationDelta(contextWithoutMessageId, state);

      await expect(
        deltaHandler({
          inputTextDelta: '{"final_response": "Test without messageId"}',
          toolCallId: 'tool-call-123',
          messages: [],
        })
      ).resolves.not.toThrow();

      expect(state.final_response).toBe('Test without messageId');
    });
  });

  describe('createRespondWithoutAssetCreationFinish', () => {
    test('should update state with final input on finish', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: undefined,
        args: '{"final_response": "Final message"}',
        final_response: 'Final message',
      };

      const finishHandler = createRespondWithoutAssetCreationFinish(mockContext, state);

      const input: RespondWithoutAssetCreationInput = {
        final_response: 'This is the final response message',
      };

      await finishHandler({
        input,
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.toolCallId).toBe('tool-call-123');
      expect(state.final_response).toBe('This is the final response message');
    });

    test('should handle finish without prior entry_id', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: undefined,
        args: undefined,
        final_response: undefined,
      };

      const finishHandler = createRespondWithoutAssetCreationFinish(mockContext, state);

      const input: RespondWithoutAssetCreationInput = {
        final_response: 'Response without prior start',
      };

      await finishHandler({
        input,
        toolCallId: 'tool-call-456',
        messages: [],
      });

      expect(state.toolCallId).toBe('tool-call-456');
      expect(state.final_response).toBe('Response without prior start');
    });

    test('should handle markdown formatted final response', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: undefined,
        args: undefined,
        final_response: undefined,
      };

      const finishHandler = createRespondWithoutAssetCreationFinish(mockContext, state);

      const markdownResponse = `
## Analysis Complete

The following items were processed:
- Item 1: Successfully analyzed
- Item 2: Completed with warnings
- Item 3: **Failed** - requires attention

### Next Steps
1. Review the failed items
2. Update configuration
3. Re-run the analysis
`;

      const input: RespondWithoutAssetCreationInput = {
        final_response: markdownResponse,
      };

      await finishHandler({
        input,
        toolCallId: 'tool-call-789',
        messages: [],
      });

      expect(state.toolCallId).toBe('tool-call-789');
      expect(state.final_response).toBe(markdownResponse);
    });

    test('should handle context without messageId', async () => {
      const contextWithoutMessageId: RespondWithoutAssetCreationContext = {
        messageId: 'test-message-id',
        workflowStartTime: Date.now(),
      };
      const state: RespondWithoutAssetCreationState = {
        toolCallId: undefined,
        args: undefined,
        final_response: undefined,
      };

      const finishHandler = createRespondWithoutAssetCreationFinish(contextWithoutMessageId, state);

      const input: RespondWithoutAssetCreationInput = {
        final_response: 'Test response without messageId',
      };

      await expect(
        finishHandler({
          input,
          toolCallId: 'tool-call-no-msg',
          messages: [],
        })
      ).resolves.not.toThrow();

      expect(state.final_response).toBe('Test response without messageId');
    });
  });

  describe('Type Safety Tests', () => {
    test('should enforce RespondWithoutAssetCreationContext type requirements', () => {
      const validContext: RespondWithoutAssetCreationContext = {
        messageId: 'message-123',
        workflowStartTime: Date.now(),
      };

      const extendedContext = {
        messageId: 'message-456',
        workflowStartTime: Date.now(),
        additionalField: 'extra-data',
      };

      const state: RespondWithoutAssetCreationState = {
        toolCallId: undefined,
        args: undefined,
        final_response: undefined,
      };

      const handler1 = createRespondWithoutAssetCreationStart(validContext, state);
      const handler2 = createRespondWithoutAssetCreationStart(extendedContext, state);

      expect(handler1).toBeDefined();
      expect(handler2).toBeDefined();
    });

    test('should maintain state type consistency through streaming lifecycle', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: undefined,
        args: undefined,
        final_response: undefined,
      };

      const startHandler = createRespondWithoutAssetCreationStart(mockContext, state);
      const deltaHandler = createRespondWithoutAssetCreationDelta(mockContext, state);
      const finishHandler = createRespondWithoutAssetCreationFinish(mockContext, state);

      await startHandler({ toolCallId: 'test-123' });
      expect(state.toolCallId).toBeTypeOf('string');

      await deltaHandler({
        inputTextDelta: '{"final_response": "Testing"}',
        toolCallId: 'test-123',
        messages: [],
      });
      expect(state.args).toBeTypeOf('string');
      expect(state.final_response).toBeTypeOf('string');

      const input: RespondWithoutAssetCreationInput = {
        final_response: 'Final test',
      };
      await finishHandler({ input, toolCallId: 'test-123', messages: [] });
      expect(state.toolCallId).toBeTypeOf('string');
      expect(state.final_response).toBeTypeOf('string');
    });
  });

  describe('Streaming Flow Integration', () => {
    test('should handle complete streaming flow from start to finish', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: undefined,
        args: undefined,
        final_response: undefined,
      };

      const startHandler = createRespondWithoutAssetCreationStart(mockContext, state);
      const deltaHandler = createRespondWithoutAssetCreationDelta(mockContext, state);
      const finishHandler = createRespondWithoutAssetCreationFinish(mockContext, state);

      const toolCallId = 'streaming-test-123';

      await startHandler({ toolCallId });
      expect(state.toolCallId).toBe(toolCallId);

      const chunks = [
        '{"final_',
        'response": "This ',
        'is a streaming ',
        'response that comes ',
        'in multiple chunks',
        '"}',
      ];

      for (const chunk of chunks) {
        await deltaHandler({
          inputTextDelta: chunk,
          toolCallId,
          messages: [],
        });
      }

      expect(state.args).toBe(
        '{"final_response": "This is a streaming response that comes in multiple chunks"}'
      );
      expect(state.final_response).toBe(
        'This is a streaming response that comes in multiple chunks'
      );

      const input: RespondWithoutAssetCreationInput = {
        final_response: 'This is a streaming response that comes in multiple chunks',
      };
      await finishHandler({ input, toolCallId, messages: [] });

      expect(state.toolCallId).toBe(toolCallId);
      expect(state.final_response).toBe(
        'This is a streaming response that comes in multiple chunks'
      );
    });

    test('should handle streaming with special characters and formatting', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: undefined,
        args: undefined,
        final_response: undefined,
      };

      const deltaHandler = createRespondWithoutAssetCreationDelta(mockContext, state);

      const chunks = [
        '{"final_response": "',
        '## Results\\n\\n',
        '- Success: 90%\\n',
        '- Failed: 10%\\n\\n',
        '**Note:** Review failed items',
        '"}',
      ];

      let accumulated = '';
      for (const chunk of chunks) {
        accumulated += chunk;
        await deltaHandler({
          inputTextDelta: chunk,
          toolCallId: 'format-test',
          messages: [],
        });
      }

      expect(state.final_response).toBe(
        '## Results\n\n- Success: 90%\n- Failed: 10%\n\n**Note:** Review failed items'
      );
    });

    test('should handle streaming with very long responses', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: undefined,
        args: undefined,
        final_response: undefined,
      };

      const deltaHandler = createRespondWithoutAssetCreationDelta(mockContext, state);

      const longText = 'A'.repeat(1000);
      const jsonWithLongText = JSON.stringify({ final_response: longText });

      await deltaHandler({
        inputTextDelta: jsonWithLongText,
        toolCallId: 'long-test',
        messages: [],
      });

      expect(state.final_response).toBe(longText);
      expect(state.final_response?.length).toBe(1000);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: 'test-entry',
        args: '',
        final_response: undefined,
      };

      const deltaHandler = createRespondWithoutAssetCreationDelta(mockContext, state);

      await expect(
        deltaHandler({
          inputTextDelta: '{"final_response": "Unclosed string',
          toolCallId: 'tool-call-123',
          messages: [],
        })
      ).resolves.not.toThrow();

      expect(state.args).toBe('{"final_response": "Unclosed string');
      expect(state.final_response).toBe('Unclosed string');
    });

    test('should handle null or undefined values', async () => {
      const state: RespondWithoutAssetCreationState = {
        toolCallId: undefined,
        args: undefined,
        final_response: undefined,
      };

      const finishHandler = createRespondWithoutAssetCreationFinish(mockContext, state);

      const input: RespondWithoutAssetCreationInput = {
        final_response: '',
      };

      await expect(
        finishHandler({
          input,
          toolCallId: 'empty-test',
          messages: [],
        })
      ).resolves.not.toThrow();

      expect(state.final_response).toBe('');
    });
  });
});
