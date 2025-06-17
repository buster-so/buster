import { NoSuchToolError } from 'ai';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import {
  type HealableStreamError,
  healStreamingToolError,
  isHealableStreamError,
} from '../../../src/utils/streaming/tool-healing';

// Mock interfaces for testing
interface MockToolError extends Error {
  toolCallId?: string;
  toolName?: string;
  args?: string;
  cause?: ZodError;
}

interface MockToolResult {
  result?: {
    error?: string;
    success?: boolean;
  };
}

describe('tool-healing', () => {
  describe('isHealableStreamError', () => {
    it('should identify NoSuchToolError as healable', () => {
      const error = new NoSuchToolError({
        toolName: 'unknownTool',
        availableTools: ['tool1', 'tool2'],
      });

      expect(isHealableStreamError(error)).toBe(true);
    });

    it('should identify InvalidToolArgumentsError as healable', () => {
      const error = new Error('Invalid tool arguments');
      error.name = 'AI_InvalidToolArgumentsError';

      expect(isHealableStreamError(error)).toBe(true);
    });

    it('should not identify other errors as healable', () => {
      const error = new Error('Some other error');

      expect(isHealableStreamError(error)).toBe(false);
    });
  });

  describe('healStreamingToolError - NoSuchToolError', () => {
    it('should provide available tools list for NoSuchToolError', () => {
      const error = new NoSuchToolError({
        toolName: 'badTool',
        availableTools: ['tool1', 'tool2'],
      });
      (error as MockToolError).toolCallId = 'test-call-id';

      const availableTools = {
        'create-metrics-file': {},
        'execute-sql': {},
        'sequential-thinking': {},
      };

      const result = healStreamingToolError(error, availableTools);

      expect(result).not.toBeNull();
      expect(result?.healed).toBe(false);
      expect(result?.healingMessage.role).toBe('tool');
      expect(result?.healingMessage.content[0]).toMatchObject({
        type: 'tool-result',
        toolCallId: 'test-call-id',
        toolName: 'badTool',
        result: {
          error: expect.stringContaining('Tool "badTool" is not available'),
        },
      });
      const toolResult = result?.healingMessage.content[0] as MockToolResult;
      expect(toolResult?.result?.error).toContain('create-metrics-file');
      expect(toolResult?.result?.error).toContain('execute-sql');
      expect(toolResult?.result?.error).toContain('sequential-thinking');
    });
  });

  describe('healStreamingToolError - InvalidToolArgumentsError for visualization tools', () => {
    it('should heal double-escaped JSON in files parameter for create-metrics-file', () => {
      const error = new Error('Invalid tool arguments');
      error.name = 'AI_InvalidToolArgumentsError';
      (error as MockToolError).toolCallId = 'test-call-id';
      (error as MockToolError).toolName = 'create-metrics-file';

      // Simulate double-escaped JSON files parameter
      const doubleEscapedArgs = JSON.stringify({
        files: JSON.stringify([
          { name: 'test-metric', yml_content: 'name: Test Metric\\nsql: SELECT 1' },
        ]),
      });
      (error as MockToolError).args = doubleEscapedArgs;

      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'array',
          received: 'string',
          path: ['files'],
          message: 'Expected array, received string',
        },
      ]);
      (error as MockToolError).cause = zodError;

      const availableTools = { 'create-metrics-file': {} };
      const result = healStreamingToolError(error, availableTools);

      expect(result).not.toBeNull();
      expect(result?.healed).toBe(true);
      expect(result?.healedArgs).toBeDefined();
      expect(result?.healedArgs.files).toBeInstanceOf(Array);
      expect(result?.healedArgs.files[0]).toMatchObject({
        name: 'test-metric',
        yml_content: 'name: Test Metric\\nsql: SELECT 1',
      });
      const toolResult = result?.healingMessage.content[0] as MockToolResult;
      expect(toolResult?.result?.success).toBe(true);
    });

    it('should heal double-escaped JSON for modify-dashboards-file', () => {
      const error = new Error('Invalid tool arguments');
      error.name = 'AI_InvalidToolArgumentsError';
      (error as MockToolError).toolCallId = 'test-call-id';
      (error as MockToolError).toolName = 'modify-dashboards-file';

      const doubleEscapedArgs = JSON.stringify({
        files: JSON.stringify([{ name: 'dashboard.json', content: '{"type": "dashboard"}' }]),
      });
      (error as MockToolError).args = doubleEscapedArgs;

      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'array',
          received: 'string',
          path: ['files'],
          message: 'Expected array, received string',
        },
      ]);
      (error as MockToolError).cause = zodError;

      const availableTools = { 'modify-dashboards-file': {} };
      const result = healStreamingToolError(error, availableTools);

      expect(result).not.toBeNull();
      expect(result?.healed).toBe(true);
      expect(result?.healedArgs.files).toBeInstanceOf(Array);
    });

    it('should provide guidance when files parameter is malformed JSON string', () => {
      const error = new Error('Invalid tool arguments');
      error.name = 'AI_InvalidToolArgumentsError';
      (error as MockToolError).toolCallId = 'test-call-id';
      (error as MockToolError).toolName = 'create-metrics-file';

      // Malformed JSON that can't be parsed
      const malformedArgs = JSON.stringify({
        files: '[{broken json',
      });
      (error as MockToolError).args = malformedArgs;

      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'array',
          received: 'string',
          path: ['files'],
          message: 'Expected array, received string',
        },
      ]);
      (error as MockToolError).cause = zodError;

      const availableTools = { 'create-metrics-file': {} };
      const result = healStreamingToolError(error, availableTools);

      expect(result).not.toBeNull();
      expect(result?.healed).toBe(false);
      const toolResult = result?.healingMessage.content[0] as MockToolResult;
      expect(toolResult?.result?.error).toContain("files' parameter should be an array");
    });

    it('should provide generic Zod error for visualization tools with other argument issues', () => {
      const error = new Error('Invalid tool arguments');
      error.name = 'AI_InvalidToolArgumentsError';
      (error as MockToolError).toolCallId = 'test-call-id';
      (error as MockToolError).toolName = 'create-dashboards-file';

      // Valid JSON but different error (missing required field)
      const validArgs = JSON.stringify({
        files: [{ name: 'test' }], // missing yml_content
      });
      (error as MockToolError).args = validArgs;

      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['files', 0, 'yml_content'],
          message: 'Required',
        },
      ]);
      (error as MockToolError).cause = zodError;

      const availableTools = { 'create-dashboards-file': {} };
      const result = healStreamingToolError(error, availableTools);

      expect(result).not.toBeNull();
      expect(result?.healed).toBe(false);
      const toolResult = result?.healingMessage.content[0] as MockToolResult;
      expect(toolResult?.result?.error).toContain('files.0.yml_content: Required');
    });
  });

  describe('healStreamingToolError - InvalidToolArgumentsError for non-visualization tools', () => {
    it('should provide generic Zod error for non-visualization tools', () => {
      const error = new Error('Invalid tool arguments');
      error.name = 'AI_InvalidToolArgumentsError';
      (error as MockToolError).toolCallId = 'test-call-id';
      (error as MockToolError).toolName = 'execute-sql';

      const args = JSON.stringify({
        query: 123, // should be string
      });
      (error as MockToolError).args = args;

      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['query'],
          message: 'Expected string, received number',
        },
      ]);
      (error as MockToolError).cause = zodError;

      const availableTools = { 'execute-sql': {} };
      const result = healStreamingToolError(error, availableTools);

      expect(result).not.toBeNull();
      expect(result?.healed).toBe(false);
      const toolResult = result?.healingMessage.content[0] as MockToolResult;
      expect(toolResult?.result?.error).toContain('Invalid arguments for execute-sql');
      expect(toolResult?.result?.error).toContain('query: Expected string, received number');
    });
  });

  describe('healStreamingToolError - unsupported errors', () => {
    it('should return null for non-healable errors', () => {
      const error = new Error('Some other error');
      const availableTools = {};

      const result = healStreamingToolError(error as HealableStreamError, availableTools);

      expect(result).toBeNull();
    });
  });
});
