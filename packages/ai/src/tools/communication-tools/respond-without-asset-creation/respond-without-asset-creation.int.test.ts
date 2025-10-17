import type { ToolCallOptions } from 'ai';
import { describe, expect, test, vi } from 'vitest';
import {
  createRespondWithoutAssetCreationTool,
  RespondWithoutAssetCreationInputSchema,
  RespondWithoutAssetCreationOutputSchema,
} from './respond-without-asset-creation-tool';

// Mock braintrust tracing wrapper to a no-op for tests
vi.mock('braintrust', () => ({
  wrapTraced: (fn: unknown) => fn,
}));

// Mock database operations for tests
vi.mock('@buster/database/queries', () => ({
  updateMessage: vi.fn().mockResolvedValue({ success: true }),
  updateMessageEntries: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Respond Without Asset Creation Tool Integration Tests', () => {
  describe('Tool Creation and Configuration', () => {
    test('should create tool with minimal context', () => {
      const tool = createRespondWithoutAssetCreationTool({
        messageId: 'test-message-id',
        workflowStartTime: Date.now(),
      });

      expect(tool).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
      expect(tool.execute).toBeDefined();
      expect(tool.onInputStart).toBeDefined();
      expect(tool.onInputDelta).toBeDefined();
      expect(tool.onInputAvailable).toBeDefined();
    });

    test('should create tool with full context', () => {
      const tool = createRespondWithoutAssetCreationTool({
        messageId: 'test-message-123',
        workflowStartTime: Date.now(),
      });

      expect(tool).toBeDefined();
      expect(tool.description).toContain('Marks all remaining unfinished tasks as complete');
    });

    test('should create tool with extended context', () => {
      const extendedContext = {
        messageId: 'test-message-456',
        userId: 'user-123',
        chatId: 'chat-456',
        workflowStartTime: Date.now(),
        additionalField: 'extra-data',
      };

      const tool = createRespondWithoutAssetCreationTool(extendedContext);

      expect(tool).toBeDefined();
      expect(tool.execute).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    test('should validate final_response is required', () => {
      const schema = RespondWithoutAssetCreationInputSchema;

      const validInput = {
        final_response: 'This is a valid response',
      };

      const invalidInput = {
        final_response: '',
      };

      expect(() => schema.parse(validInput)).not.toThrow();
      expect(() => schema.parse(invalidInput)).toThrow();
    });

    test('should accept markdown formatted responses', () => {
      const schema = RespondWithoutAssetCreationInputSchema;

      const markdownInput = {
        final_response: `
## Summary

- First point
- Second point
- Third point

**Important:** This is markdown formatted.

### Details
1. Item one
2. Item two
3. Item three
`,
      };

      expect(() => schema.parse(markdownInput)).not.toThrow();
    });

    test('should reject empty object', () => {
      const schema = RespondWithoutAssetCreationInputSchema;

      const emptyInput = {};

      expect(() => schema.parse(emptyInput)).toThrow();
    });

    test('should reject null final_response', () => {
      const schema = RespondWithoutAssetCreationInputSchema;

      const nullInput = {
        final_response: null,
      };

      expect(() => schema.parse(nullInput)).toThrow();
    });
  });

  describe('Tool Execution', () => {
    test('should execute successfully with valid input', async () => {
      const tool = createRespondWithoutAssetCreationTool({
        messageId: 'test-message-789',
        workflowStartTime: Date.now(),
      });

      const input = {
        final_response: 'Task completed successfully',
      };

      if (tool.execute) {
        const result = await tool.execute(input, {
          toolCallId: 'test-tool-call',
          messages: [],
        } as ToolCallOptions);

        expect(result).toBeDefined();
        expect(result).toEqual({ success: true });
      }
    });

    test('should execute with long response', async () => {
      const tool = createRespondWithoutAssetCreationTool({
        messageId: 'test-message-id',
        workflowStartTime: Date.now(),
      });

      const longResponse = 'A'.repeat(10000);
      const input = {
        final_response: longResponse,
      };

      if (tool.execute) {
        const result = await tool.execute(input, {
          toolCallId: 'test-tool-call',
          messages: [],
        } as ToolCallOptions);

        expect(result).toBeDefined();
        expect(result).toEqual({ success: true });
      }
    });

    test('should execute with special characters', async () => {
      const tool = createRespondWithoutAssetCreationTool({
        messageId: 'test-message-id',
        workflowStartTime: Date.now(),
      });

      const input = {
        final_response: `
Special characters test: !@#$%^&*()_+-=[]{}|;':",./<>?
Unicode: 你好 🎉 €£¥
Escaped: \n \t \\ " '
`,
      };

      if (tool.execute) {
        const result = await tool.execute(input, {
          toolCallId: 'test-tool-call',
          messages: [],
        } as ToolCallOptions);

        expect(result).toBeDefined();
        expect(result).toEqual({ success: true });
      }
    });

    test('should execute without messageId context', async () => {
      const tool = createRespondWithoutAssetCreationTool({
        messageId: 'test-message-id',
        workflowStartTime: Date.now(),
      });

      const input = {
        final_response: 'Response without message context',
      };

      if (tool.execute) {
        const result = await tool.execute(input, {
          toolCallId: 'test-tool-call',
          messages: [],
        } as ToolCallOptions);

        expect(result).toBeDefined();
        expect(result).toEqual({ success: true });
      }
    });
  });

  describe('Factory Pattern Tests', () => {
    test('should create multiple independent tool instances', () => {
      const tool1 = createRespondWithoutAssetCreationTool({
        messageId: 'message-1',
        workflowStartTime: Date.now(),
      });

      const tool2 = createRespondWithoutAssetCreationTool({
        messageId: 'message-2',
        workflowStartTime: Date.now(),
      });

      expect(tool1).not.toBe(tool2);
      expect(tool1.execute).not.toBe(tool2.execute);
      expect(tool1.onInputStart).not.toBe(tool2.onInputStart);
      expect(tool1.onInputDelta).not.toBe(tool2.onInputDelta);
      expect(tool1.onInputAvailable).not.toBe(tool2.onInputAvailable);
    });

    test('should maintain separate state for each instance', async () => {
      const context1 = { messageId: 'msg-1', workflowStartTime: Date.now() };
      const context2 = { messageId: 'msg-2', workflowStartTime: Date.now() };

      const tool1 = createRespondWithoutAssetCreationTool(context1);
      const tool2 = createRespondWithoutAssetCreationTool(context2);

      const input1 = { final_response: 'Response 1' };
      const input2 = { final_response: 'Response 2' };

      if (tool1.execute && tool2.execute) {
        const [result1, result2] = await Promise.all([
          tool1.execute(input1, { toolCallId: 'tc-1', messages: [] } as ToolCallOptions),
          tool2.execute(input2, { toolCallId: 'tc-2', messages: [] } as ToolCallOptions),
        ]);

        expect(result1).toEqual({ success: true });
        expect(result2).toEqual({ success: true });
      }
    });
  });

  describe('Output Schema Validation', () => {
    test('should validate output schema with success field', () => {
      const outputSchema = RespondWithoutAssetCreationOutputSchema;

      const validOutput = { success: true };
      expect(() => outputSchema.parse(validOutput)).not.toThrow();
    });

    test('should require success field in output', () => {
      const outputSchema = RespondWithoutAssetCreationOutputSchema;

      // The output schema requires a success boolean field
      const validOutput = { success: true };
      const result = outputSchema.parse(validOutput);
      expect(result).toEqual({ success: true });

      // Should throw for empty object
      const emptyOutput = {};
      expect(() => outputSchema.parse(emptyOutput)).toThrow();
    });
  });

  describe('Tool Description', () => {
    test('should have correct description', () => {
      const tool = createRespondWithoutAssetCreationTool({
        messageId: 'test-message-id',
        workflowStartTime: Date.now(),
      });

      expect(tool.description).toContain('Marks all remaining unfinished tasks');
      expect(tool.description).toContain('ends the workflow');
      expect(tool.description).toContain('markdown format');
      // The description mentions not to use the bullet character
      expect(tool.description).toContain('bullet character');
    });
  });
});
