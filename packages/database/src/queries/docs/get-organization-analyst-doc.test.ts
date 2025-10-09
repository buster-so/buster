import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';
import {
  GetOrganizationAnalystDocParamsSchema,
  getOrganizationAnalystDoc,
} from './get-organization-analyst-doc';

// Mock the database connection and schema
vi.mock('../../connection', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock('../../schema', () => ({
  docs: {
    content: 'content',
    organizationId: 'organizationId',
    type: 'type',
    deletedAt: 'deletedAt',
  },
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  eq: vi.fn((column, value) => ({ type: 'eq', column, value })),
  isNull: vi.fn((column) => ({ type: 'isNull', column })),
}));

import { db } from '../../connection';

const mockDb = vi.mocked(db);

describe('GetOrganizationAnalystDocParamsSchema', () => {
  it('should validate valid UUID organization ID', () => {
    const validParams = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = GetOrganizationAnalystDocParamsSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.organizationId).toBe(validParams.organizationId);
    }
  });

  it('should reject invalid UUID format', () => {
    const invalidParams = {
      organizationId: 'not-a-valid-uuid',
    };

    const result = GetOrganizationAnalystDocParamsSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject missing organization ID', () => {
    const emptyParams = {};

    const result = GetOrganizationAnalystDocParamsSchema.safeParse(emptyParams);
    expect(result.success).toBe(false);
  });

  it('should reject empty string organization ID', () => {
    const invalidParams = {
      organizationId: '',
    };

    const result = GetOrganizationAnalystDocParamsSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject non-string organization ID', () => {
    const invalidParams = {
      organizationId: 123,
    };

    const result = GetOrganizationAnalystDocParamsSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });
});

describe('getOrganizationAnalystDoc', () => {
  const validParams = {
    organizationId: '123e4567-e89b-12d3-a456-426614174000',
  };

  let mockSelect: MockedFunction<typeof vi.fn>;
  let mockFrom: MockedFunction<typeof vi.fn>;
  let mockWhere: MockedFunction<typeof vi.fn>;
  let mockLimit: MockedFunction<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLimit = vi.fn().mockResolvedValue([]);
    mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    mockDb.select = mockSelect;
  });

  it('should validate params before database query', async () => {
    const invalidParams = {
      organizationId: 'invalid-uuid',
    };

    await expect(getOrganizationAnalystDoc(invalidParams)).rejects.toThrow();
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should return analyst doc content when found', async () => {
    const mockResult = [{ content: '# Analyst Guide\nThis is analyst documentation' }];
    mockLimit.mockResolvedValue(mockResult);

    const result = await getOrganizationAnalystDoc(validParams);

    expect(mockSelect).toHaveBeenCalledWith({
      content: expect.any(String), // docs.content
    });
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
    expect(mockLimit).toHaveBeenCalledWith(1);
    expect(result).toBe('# Analyst Guide\nThis is analyst documentation');
  });

  it('should return null when no analyst doc found', async () => {
    mockLimit.mockResolvedValue([]);

    const result = await getOrganizationAnalystDoc(validParams);

    expect(result).toBeNull();
  });

  it('should return null when result has no content', async () => {
    const mockResult = [{}]; // No content field
    mockLimit.mockResolvedValue(mockResult);

    const result = await getOrganizationAnalystDoc(validParams);

    expect(result).toBeNull();
  });

  it('should return null when content is null', async () => {
    const mockResult = [{ content: null }];
    mockLimit.mockResolvedValue(mockResult);

    const result = await getOrganizationAnalystDoc(validParams);

    expect(result).toBeNull();
  });

  it('should return empty string for empty string content', async () => {
    const mockResult = [{ content: '' }];
    mockLimit.mockResolvedValue(mockResult);

    const result = await getOrganizationAnalystDoc(validParams);

    // Should return the actual empty string, not null
    expect(result).toBe('');
  });

  it('should use correct database query conditions', async () => {
    await getOrganizationAnalystDoc(validParams);

    // Verify the query was constructed with correct conditions
    expect(mockSelect).toHaveBeenCalledWith({
      content: expect.any(String),
    });
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'and',
        conditions: expect.any(Array),
      })
    );
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it('should handle database errors', async () => {
    mockLimit.mockRejectedValue(new Error('Database connection failed'));

    await expect(getOrganizationAnalystDoc(validParams)).rejects.toThrow(
      'Database connection failed'
    );
  });

  it('should handle multiple results by returning first', async () => {
    const mockResult = [{ content: 'First analyst doc' }, { content: 'Second analyst doc' }];
    mockLimit.mockResolvedValue(mockResult);

    const result = await getOrganizationAnalystDoc(validParams);

    expect(result).toBe('First analyst doc');
    expect(mockLimit).toHaveBeenCalledWith(1); // Should limit to 1 anyway
  });

  it('should handle long content strings', async () => {
    const longContent = 'A'.repeat(10000); // 10k character content
    const mockResult = [{ content: longContent }];
    mockLimit.mockResolvedValue(mockResult);

    const result = await getOrganizationAnalystDoc(validParams);

    expect(result).toBe(longContent);
  });

  it('should handle special characters in content', async () => {
    const specialContent = '# Test\n\n```sql\nSELECT * FROM "users";\n```\n\n- Item 1\n- Item 2';
    const mockResult = [{ content: specialContent }];
    mockLimit.mockResolvedValue(mockResult);

    const result = await getOrganizationAnalystDoc(validParams);

    expect(result).toBe(specialContent);
  });
});
