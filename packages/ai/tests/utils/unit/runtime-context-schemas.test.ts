import { describe, expect, test } from 'vitest';
import {
  analystRuntimeContextSchema,
  initialStepRuntimeContextSchema,
  thinkAndPrepRuntimeContextSchema,
} from '../../../src/utils/validation-helpers';

describe('Runtime Context Schema Tests', () => {
  describe('initialStepRuntimeContextSchema', () => {
    test('should accept context with only base fields and threadId', () => {
      const validContext = {
        userId: 'user-123',
        organizationId: 'org-456',
        threadId: 'thread-789',
      };

      const result = initialStepRuntimeContextSchema.parse(validContext);
      expect(result).toEqual(validContext);
    });

    test('should accept context with optional messageId', () => {
      const validContext = {
        userId: 'user-123',
        organizationId: 'org-456',
        threadId: 'thread-789',
        messageId: 'msg-123',
      };

      const result = initialStepRuntimeContextSchema.parse(validContext);
      expect(result).toEqual(validContext);
    });

    test('should reject context without threadId', () => {
      const invalidContext = {
        userId: 'user-123',
        organizationId: 'org-456',
      };

      expect(() => initialStepRuntimeContextSchema.parse(invalidContext)).toThrow();
    });

    test('should not require dataSourceId, dataSourceSyntax, or todos', () => {
      const validContext = {
        userId: 'user-123',
        organizationId: 'org-456',
        threadId: 'thread-789',
      };

      // This should pass without those fields
      const result = initialStepRuntimeContextSchema.parse(validContext);
      expect(result).toEqual(validContext);
      expect((result as any).dataSourceId).toBeUndefined();
      expect((result as any).dataSourceSyntax).toBeUndefined();
      expect((result as any).todos).toBeUndefined();
    });
  });

  describe('thinkAndPrepRuntimeContextSchema', () => {
    test('should accept context with all required fields except todos', () => {
      const validContext = {
        userId: 'user-123',
        organizationId: 'org-456',
        threadId: 'thread-789',
        dataSourceId: 'ds-001',
        dataSourceSyntax: 'postgresql',
      };

      const result = thinkAndPrepRuntimeContextSchema.parse(validContext);
      expect(result).toEqual(validContext);
    });

    test('should accept context with optional messageId', () => {
      const validContext = {
        userId: 'user-123',
        organizationId: 'org-456',
        threadId: 'thread-789',
        dataSourceId: 'ds-001',
        dataSourceSyntax: 'postgresql',
        messageId: 'msg-123',
      };

      const result = thinkAndPrepRuntimeContextSchema.parse(validContext);
      expect(result).toEqual(validContext);
    });

    test('should reject context without dataSourceId', () => {
      const invalidContext = {
        userId: 'user-123',
        organizationId: 'org-456',
        threadId: 'thread-789',
        dataSourceSyntax: 'postgresql',
      };

      expect(() => thinkAndPrepRuntimeContextSchema.parse(invalidContext)).toThrow();
    });

    test('should reject context without dataSourceSyntax', () => {
      const invalidContext = {
        userId: 'user-123',
        organizationId: 'org-456',
        threadId: 'thread-789',
        dataSourceId: 'ds-001',
      };

      expect(() => thinkAndPrepRuntimeContextSchema.parse(invalidContext)).toThrow();
    });

    test('should not require todos field', () => {
      const validContext = {
        userId: 'user-123',
        organizationId: 'org-456',
        threadId: 'thread-789',
        dataSourceId: 'ds-001',
        dataSourceSyntax: 'postgresql',
      };

      // This should pass without todos field
      const result = thinkAndPrepRuntimeContextSchema.parse(validContext);
      expect(result).toEqual(validContext);
      expect((result as any).todos).toBeUndefined();
    });
  });

  describe('analystRuntimeContextSchema', () => {
    test('should accept context with all required fields including todos', () => {
      const validContext = {
        userId: 'user-123',
        organizationId: 'org-456',
        threadId: 'thread-789',
        dataSourceId: 'ds-001',
        dataSourceSyntax: 'postgresql',
        todos: '[ ] Task 1\n[ ] Task 2',
      };

      const result = analystRuntimeContextSchema.parse(validContext);
      expect(result).toEqual(validContext);
    });

    test('should reject context without todos', () => {
      const invalidContext = {
        userId: 'user-123',
        organizationId: 'org-456',
        threadId: 'thread-789',
        dataSourceId: 'ds-001',
        dataSourceSyntax: 'postgresql',
      };

      expect(() => analystRuntimeContextSchema.parse(invalidContext)).toThrow();
    });
  });

  describe('Schema relationships', () => {
    test('initialStepRuntimeContextSchema should be a subset of thinkAndPrepRuntimeContextSchema', () => {
      const context = {
        userId: 'user-123',
        organizationId: 'org-456',
        threadId: 'thread-789',
        dataSourceId: 'ds-001',
        dataSourceSyntax: 'postgresql',
      };

      // Context valid for thinkAndPrep should also be valid for initialStep
      // (but not vice versa)
      const thinkAndPrepResult = thinkAndPrepRuntimeContextSchema.parse(context);
      const initialStepResult = initialStepRuntimeContextSchema.parse(context);

      expect(thinkAndPrepResult).toBeDefined();
      expect(initialStepResult).toBeDefined();
    });

    test('thinkAndPrepRuntimeContextSchema should be a subset of analystRuntimeContextSchema', () => {
      const context = {
        userId: 'user-123',
        organizationId: 'org-456',
        threadId: 'thread-789',
        dataSourceId: 'ds-001',
        dataSourceSyntax: 'postgresql',
        todos: '[ ] Task 1',
      };

      // Context valid for analyst should also be valid for thinkAndPrep
      // (but not vice versa)
      const analystResult = analystRuntimeContextSchema.parse(context);
      const thinkAndPrepResult = thinkAndPrepRuntimeContextSchema.parse(context);

      expect(analystResult).toBeDefined();
      expect(thinkAndPrepResult).toBeDefined();
    });
  });
});