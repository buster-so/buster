import { describe, expect, it } from 'vitest';
import {
  MessageContentSchema,
  ReasoningContentSchema,
  TextContentSchema,
  ToolCallContentSchema,
  ToolResultContentSchema,
} from './content-schemas';

describe('AI SDK v5 Content Schemas', () => {
  describe('TextContentSchema', () => {
    it('should validate text content object', () => {
      const valid = { type: 'text', text: 'Hello world' };
      expect(() => TextContentSchema.parse(valid)).not.toThrow();
    });

    it('should reject missing text field', () => {
      const invalid = { type: 'text' };
      expect(() => TextContentSchema.parse(invalid)).toThrow();
    });

    it('should reject wrong type', () => {
      const invalid = { type: 'other', text: 'Hello' };
      expect(() => TextContentSchema.parse(invalid)).toThrow();
    });
  });

  describe('ReasoningContentSchema', () => {
    it('should validate reasoning content object', () => {
      const valid = { type: 'reasoning', text: 'Thinking...' };
      expect(() => ReasoningContentSchema.parse(valid)).not.toThrow();
    });

    it('should reject missing text field', () => {
      const invalid = { type: 'reasoning' };
      expect(() => ReasoningContentSchema.parse(invalid)).toThrow();
    });
  });

  describe('ToolCallContentSchema', () => {
    it('should validate tool call with all required fields', () => {
      const valid = {
        type: 'tool-call',
        toolCallId: 'call_123',
        toolName: 'bash',
        input: { command: 'ls' },
      };
      expect(() => ToolCallContentSchema.parse(valid)).not.toThrow();
    });

    it('should reject missing toolCallId', () => {
      const invalid = {
        type: 'tool-call',
        toolName: 'bash',
        input: {},
      };
      expect(() => ToolCallContentSchema.parse(invalid)).toThrow();
    });

    it('should reject missing toolName', () => {
      const invalid = {
        type: 'tool-call',
        toolCallId: 'call_123',
        input: {},
      };
      expect(() => ToolCallContentSchema.parse(invalid)).toThrow();
    });
  });

  describe('ToolResultContentSchema', () => {
    it('should validate tool result with json output', () => {
      const valid = {
        type: 'tool-result',
        toolCallId: 'call_123',
        toolName: 'bash',
        output: { type: 'json', value: '{"status":"success"}' },
      };
      expect(() => ToolResultContentSchema.parse(valid)).not.toThrow();
    });

    it('should handle string output value', () => {
      const valid = {
        type: 'tool-result',
        toolCallId: 'call_123',
        toolName: 'read',
        output: { type: 'json', value: 'file contents' },
      };
      expect(() => ToolResultContentSchema.parse(valid)).not.toThrow();
    });

    it('should reject missing output field', () => {
      const invalid = {
        type: 'tool-result',
        toolCallId: 'call_123',
        toolName: 'bash',
      };
      expect(() => ToolResultContentSchema.parse(invalid)).toThrow();
    });
  });

  describe('MessageContentSchema (discriminated union)', () => {
    it('should validate all content types via discriminated union', () => {
      const textContent = { type: 'text', text: 'Hi' };
      const reasoningContent = { type: 'reasoning', text: 'Thinking' };
      const toolCallContent = {
        type: 'tool-call',
        toolCallId: '123',
        toolName: 'bash',
        input: {},
      };
      const toolResultContent = {
        type: 'tool-result',
        toolCallId: '123',
        toolName: 'bash',
        output: { type: 'json', value: '{}' },
      };

      expect(() => MessageContentSchema.parse(textContent)).not.toThrow();
      expect(() => MessageContentSchema.parse(reasoningContent)).not.toThrow();
      expect(() => MessageContentSchema.parse(toolCallContent)).not.toThrow();
      expect(() => MessageContentSchema.parse(toolResultContent)).not.toThrow();
    });

    it('should reject invalid content type', () => {
      const invalid = { type: 'unknown', data: 'test' };
      expect(() => MessageContentSchema.parse(invalid)).toThrow();
    });

    it('should use discriminator for type narrowing', () => {
      const content = { type: 'text', text: 'Hello' };
      const parsed = MessageContentSchema.parse(content);

      if (parsed.type === 'text') {
        // TypeScript should know this has 'text' property
        expect(parsed.text).toBe('Hello');
      }
    });
  });
});
