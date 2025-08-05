/**
 * Tests for Resilient Tool Wrappers
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  ResilientToolRegistry,
  createResilientBashTool,
  createResilientFileCreationTool,
  createResilientFileEditingTool,
  createResilientFileListingTool,
  createResilientFileReadingTool,
  executeSafelyInSandbox,
  executeSandboxCommandSafely,
  makeCompletelysafe,
  parseSandboxResultSafely,
  resilientTools,
  validateToolInput,
} from './resilient-tool-wrappers';

describe('Resilient Tool Wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeSafelyInSandbox', () => {
    it('should execute operation successfully', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const fallback = vi.fn().mockReturnValue('fallback');

      const result = await executeSafelyInSandbox(operation, fallback, 'test');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
      expect(fallback).not.toHaveBeenCalled();
    });

    it('should use fallback when operation fails', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      const fallback = vi.fn().mockReturnValue('fallback result');

      const result = await executeSafelyInSandbox(operation, fallback, 'test');

      expect(result).toBe('fallback result');
      expect(fallback).toHaveBeenCalled();
    });
  });

  describe('executeSandboxCommandSafely', () => {
    it('should execute command successfully', async () => {
      const mockSandbox = {
        process: {
          executeCommand: vi.fn().mockResolvedValue({
            result: 'command output',
            exitCode: 0,
          }),
        },
      };

      const result = await executeSandboxCommandSafely(mockSandbox, 'test command', 'test context');

      expect(result.success).toBe(true);
      expect(result.output).toBe('command output');
      expect(result.exitCode).toBe(0);
      expect(result.error).toBeUndefined();
    });

    it('should handle command failure gracefully', async () => {
      const mockSandbox = {
        process: {
          executeCommand: vi.fn().mockResolvedValue({
            result: 'error output',
            exitCode: 1,
          }),
        },
      };

      const result = await executeSandboxCommandSafely(
        mockSandbox,
        'failing command',
        'test context'
      );

      expect(result.success).toBe(false);
      expect(result.output).toBe('error output');
      expect(result.exitCode).toBe(1);
    });

    it('should handle sandbox execution errors', async () => {
      const mockSandbox = {
        process: {
          executeCommand: vi.fn().mockRejectedValue(new Error('Sandbox error')),
        },
      };

      const result = await executeSandboxCommandSafely(mockSandbox, 'test command', 'test context');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('Sandbox command execution failed');
    });
  });

  describe('parseSandboxResultSafely', () => {
    it('should parse valid JSON', () => {
      const result = parseSandboxResultSafely('{"success": true}', 'test parse', {
        success: false,
      });

      expect(result).toEqual({ success: true });
    });

    it('should use fallback for invalid JSON', () => {
      const fallback = { success: false, error: 'fallback' };
      const result = parseSandboxResultSafely('invalid json', 'test parse', fallback);

      expect(result).toEqual(fallback);
    });

    it('should handle empty string', () => {
      const fallback = { empty: true };
      const result = parseSandboxResultSafely('', 'test parse', fallback);

      expect(result).toEqual(fallback);
    });
  });

  describe('validateToolInput', () => {
    const testSchema = z.object({
      name: z.string(),
      count: z.number(),
    });

    it('should validate correct input', () => {
      const input = { name: 'test', count: 5 };
      const result = validateToolInput(testSchema, input, 'test-tool');

      expect(result).toEqual(input);
    });

    it('should throw validation error for invalid input', () => {
      const input = { name: 'test', count: 'not-a-number' };

      expect(() => {
        validateToolInput(testSchema, input, 'test-tool');
      }).toThrow('[test-tool] Invalid input');
    });

    it('should throw validation error for missing fields', () => {
      const input = { name: 'test' };

      expect(() => {
        validateToolInput(testSchema, input, 'test-tool');
      }).toThrow('[test-tool] Invalid input');
    });
  });

  describe('makeCompletelysafe', () => {
    it('should execute function successfully', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const safeDefault = vi.fn().mockReturnValue('default');
      const safeFn = makeCompletelysafe(fn, safeDefault, 'test-fn');

      const result = await safeFn('input');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledWith('input');
      expect(safeDefault).not.toHaveBeenCalled();
    });

    it('should use safe default on failure', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Function failed'));
      const safeDefault = vi.fn().mockReturnValue('safe result');
      const safeFn = makeCompletelysafe(fn, safeDefault, 'test-fn');

      const result = await safeFn('input');

      expect(result).toBe('safe result');
      expect(safeDefault).toHaveBeenCalledWith('input', 'Function failed');
    });

    it('should handle unexpected errors', async () => {
      const fn = vi.fn().mockImplementation(() => {
        throw new Error('Synchronous error');
      });
      const safeDefault = vi.fn().mockReturnValue('safe result');
      const safeFn = makeCompletelysafe(fn, safeDefault, 'test-fn');

      const result = await safeFn('input');

      expect(result).toBe('safe result');
      expect(safeDefault).toHaveBeenCalled();
    });
  });

  describe('ResilientToolRegistry', () => {
    let registry: ResilientToolRegistry;

    beforeEach(() => {
      registry = new ResilientToolRegistry();
    });

    it('should register and retrieve tools', () => {
      const tool = vi.fn().mockResolvedValue('result');
      const safeDefault = vi.fn().mockReturnValue('default');

      registry.register('test-tool', tool, safeDefault);

      const retrievedTool = registry.get('test-tool');
      expect(retrievedTool).toBeDefined();
      expect(typeof retrievedTool).toBe('function');
    });

    it('should list registered tools', () => {
      const tool1 = vi.fn();
      const tool2 = vi.fn();
      const safeDefault = vi.fn();

      registry.register('tool1', tool1, safeDefault);
      registry.register('tool2', tool2, safeDefault);

      const tools = registry.list();
      expect(tools).toContain('tool1');
      expect(tools).toContain('tool2');
      expect(tools).toHaveLength(2);
    });

    it('should return undefined for non-existent tools', () => {
      const tool = registry.get('non-existent');
      expect(tool).toBeUndefined();
    });

    it('should execute registered tool safely', async () => {
      const tool = vi.fn().mockResolvedValue('success');
      const safeDefault = vi.fn().mockReturnValue('default');

      registry.register('test-tool', tool, safeDefault);

      const retrievedTool = registry.get('test-tool');
      const result = await retrievedTool!('test input');

      expect(result).toBe('success');
      expect(tool).toHaveBeenCalledWith('test input');
    });

    it('should use safe default when registered tool fails', async () => {
      const tool = vi.fn().mockRejectedValue(new Error('Tool failed'));
      const safeDefault = vi.fn().mockReturnValue('safe result');

      registry.register('test-tool', tool, safeDefault);

      const retrievedTool = registry.get('test-tool');
      const result = await retrievedTool!('test input');

      expect(result).toBe('safe result');
      expect(safeDefault).toHaveBeenCalledWith('test input', 'Tool failed');
    });
  });

  describe('global resilientTools registry', () => {
    it('should be an instance of ResilientToolRegistry', () => {
      expect(resilientTools).toBeInstanceOf(ResilientToolRegistry);
    });

    it('should have registration methods', () => {
      expect(typeof resilientTools.register).toBe('function');
      expect(typeof resilientTools.get).toBe('function');
      expect(typeof resilientTools.list).toBe('function');
    });
  });

  describe('tool factory functions', () => {
    it('should create resilient bash tool', () => {
      const bashTool = createResilientBashTool();
      expect(typeof bashTool).toBe('function');
    });

    it('should create resilient file creation tool', () => {
      const creationTool = createResilientFileCreationTool();
      expect(typeof creationTool).toBe('function');
    });

    it('should create resilient file reading tool', () => {
      const readingTool = createResilientFileReadingTool();
      expect(typeof readingTool).toBe('function');
    });

    it('should create resilient file editing tool', () => {
      const editingTool = createResilientFileEditingTool();
      expect(typeof editingTool).toBe('function');
    });

    it('should create resilient file listing tool', () => {
      const listingTool = createResilientFileListingTool();
      expect(typeof listingTool).toBe('function');
    });
  });
});
