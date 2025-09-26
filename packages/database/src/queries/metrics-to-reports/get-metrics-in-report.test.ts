import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetMetricIdsInReportInputSchema, getMetricIdsInReport } from './get-metrics-in-report';

// Mock the database connection and schema
vi.mock('../../connection', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

vi.mock('../../schema', () => ({
  metricFilesToReportFiles: {
    metricFileId: 'metricFileId',
    reportFileId: 'reportFileId',
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

describe('GetMetricIdsInReportInputSchema', () => {
  it('should validate valid UUID report ID', () => {
    const validParams = {
      reportId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = GetMetricIdsInReportInputSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reportId).toBe(validParams.reportId);
    }
  });

  it('should reject invalid UUID format', () => {
    const invalidParams = {
      reportId: 'not-a-valid-uuid',
    };

    const result = GetMetricIdsInReportInputSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject missing report ID', () => {
    const emptyParams = {};

    const result = GetMetricIdsInReportInputSchema.safeParse(emptyParams);
    expect(result.success).toBe(false);
  });

  it('should reject non-string report ID', () => {
    const invalidParams = {
      reportId: 123,
    };

    const result = GetMetricIdsInReportInputSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });
});

describe('getMetricIdsInReport', () => {
  const validParams = {
    reportId: '123e4567-e89b-12d3-a456-426614174000',
  };

  let mockSelect: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockWhere: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockWhere = vi.fn().mockResolvedValue([]);
    mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    mockDb.select = mockSelect;
  });

  it('should validate params before database query', async () => {
    const invalidParams = {
      reportId: 'invalid-uuid',
    };

    await expect(getMetricIdsInReport(invalidParams)).rejects.toThrow();
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should return metric IDs when found', async () => {
    const mockResults = [
      { metricFileId: 'metric-1' },
      { metricFileId: 'metric-2' },
      { metricFileId: 'metric-3' },
    ];
    mockWhere.mockResolvedValue(mockResults);

    const result = await getMetricIdsInReport(validParams);

    expect(mockSelect).toHaveBeenCalledWith({
      metricFileId: expect.any(String),
    });
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
    expect(result).toEqual(['metric-1', 'metric-2', 'metric-3']);
  });

  it('should return empty array when no metrics found', async () => {
    mockWhere.mockResolvedValue([]);

    const result = await getMetricIdsInReport(validParams);

    expect(result).toEqual([]);
  });

  it('should use correct database query conditions', async () => {
    await getMetricIdsInReport(validParams);

    // Verify the query was constructed with correct conditions
    expect(mockSelect).toHaveBeenCalledWith({
      metricFileId: expect.any(String),
    });
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'and',
        conditions: expect.arrayContaining([
          expect.objectContaining({
            type: 'eq',
            column: expect.any(String),
            value: validParams.reportId,
          }), // reportFileId condition
          expect.objectContaining({
            type: 'isNull',
            column: expect.any(String),
          }), // not deleted condition
        ]),
      })
    );
  });

  it('should handle database errors', async () => {
    mockWhere.mockRejectedValue(new Error('Database query failed'));

    await expect(getMetricIdsInReport(validParams)).rejects.toThrow('Database query failed');
  });

  it('should handle single metric result', async () => {
    const mockResults = [{ metricFileId: 'single-metric-id' }];
    mockWhere.mockResolvedValue(mockResults);

    const result = await getMetricIdsInReport(validParams);

    expect(result).toEqual(['single-metric-id']);
    expect(result).toHaveLength(1);
  });

  it('should handle large result sets', async () => {
    const largeResults = Array.from({ length: 100 }, (_, i) => ({
      metricFileId: `metric-${i}`,
    }));
    mockWhere.mockResolvedValue(largeResults);

    const result = await getMetricIdsInReport(validParams);

    expect(result).toHaveLength(100);
    expect(result[0]).toBe('metric-0');
    expect(result[99]).toBe('metric-99');
  });

  it('should filter out soft-deleted relationships', async () => {
    // This test verifies the query construction filters for deletedAt IS NULL
    // since that happens at the database level
    await getMetricIdsInReport(validParams);

    expect(mockWhere).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'and',
        conditions: expect.arrayContaining([
          expect.objectContaining({ type: 'isNull' }), // Should have isNull condition for deletedAt
        ]),
      })
    );
  });

  it('should filter by correct report ID', async () => {
    const specificReportId = '123e4567-e89b-12d3-a456-426614174001';
    const paramsWithSpecificId = { reportId: specificReportId };

    await getMetricIdsInReport(paramsWithSpecificId);

    expect(mockWhere).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'and',
        conditions: expect.arrayContaining([
          expect.objectContaining({
            type: 'eq',
            value: specificReportId,
          }), // Should filter by the specific report ID
        ]),
      })
    );
  });

  it('should handle metrics with UUID format', async () => {
    const mockResults = [
      { metricFileId: '123e4567-e89b-12d3-a456-426614174001' },
      { metricFileId: '123e4567-e89b-12d3-a456-426614174002' },
    ];
    mockWhere.mockResolvedValue(mockResults);

    const result = await getMetricIdsInReport(validParams);

    expect(result).toEqual([
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
    ]);
  });

  it('should handle unexpected database response format gracefully', async () => {
    // Edge case: database returns unexpected format
    const unexpectedResults = [
      { metricFileId: null },
      { metricFileId: undefined },
      { metricFileId: '' },
      { metricFileId: 'valid-metric-id' },
    ];
    mockWhere.mockResolvedValue(unexpectedResults);

    const result = await getMetricIdsInReport(validParams);

    // The function should return what the database gives it
    // Validation of UUIDs would happen at a higher level
    expect(result).toEqual([null, undefined, '', 'valid-metric-id']);
  });

  it('should use correct table and columns', async () => {
    await getMetricIdsInReport(validParams);

    // Verify we're selecting the right column
    expect(mockSelect).toHaveBeenCalledWith({
      metricFileId: expect.any(String),
    });

    // Verify we're using the metricFilesToReportFiles table
    expect(mockFrom).toHaveBeenCalled();
  });
});
