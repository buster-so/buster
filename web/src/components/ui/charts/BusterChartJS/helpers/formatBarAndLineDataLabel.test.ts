import type { ColumnLabelFormat } from '@/api/asset_interfaces/metric';
import type { Context } from 'chartjs-plugin-datalabels';
import { describe, expect, it } from 'vitest';
import { formatBarAndLineDataLabel } from './formatBarAndLineDataLabel';

describe('formatBarAndLineDataLabel', () => {
  it('formats a single value without percentage', () => {
    const value = 1234.56;
    const columnLabelFormat: ColumnLabelFormat = {
      style: 'number',
      columnType: 'number',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    };

    const mockContext = {
      chart: {
        data: {
          datasets: []
        },
        $totalizer: {
          stackTotals: [],
          seriesTotals: []
        }
      },
      active: false,
      dataIndex: 0,
      dataset: {},
      datasetIndex: 0
    } as unknown as Context;

    const result = formatBarAndLineDataLabel(value, mockContext, false, columnLabelFormat);

    expect(result).toBe('1,234.56');
  });

  // Mock chart context
  const createMockContext = (datasets: any[]): Partial<Context> => ({
    chart: {
      data: {
        datasets
      },
      $totalizer: {
        stackTotals: [100],
        seriesTotals: [50]
      }
    } as any,
    dataIndex: 0,
    datasetIndex: 0
  });

  describe('useStackTotal logic', () => {
    const baseDataset = { hidden: false, isTrendline: false };
    it('should use stack total when there are multiple visible datasets', () => {
      const mockContext = createMockContext([baseDataset, { ...baseDataset }]) as Context;

      const result = formatBarAndLineDataLabel(25, mockContext, 'data-label', {
        style: 'number',
        columnType: 'number'
      });

      // 25 out of stack total (100) = 25%
      expect(result).toBe('25%');
    });
    it('should use stack total when percentageMode is stacked', () => {
      const mockContext = createMockContext([baseDataset]) as Context;

      const result = formatBarAndLineDataLabel(25, mockContext, 'stacked', {
        style: 'number',
        columnType: 'number'
      });

      // 25 out of stack total (100) = 25%
      expect(result).toBe('25%');
    });
    it('should use series total for single dataset and non-stacked percentage mode', () => {
      const mockContext = createMockContext([baseDataset]) as Context;

      const result = formatBarAndLineDataLabel(25, mockContext, 'data-label', {
        style: 'number',
        columnType: 'number'
      });

      // 25 out of series total (50) = 50%
      expect(result).toBe('50%');
    });
    it('should ignore hidden datasets when counting multiple datasets', () => {
      const mockContext = createMockContext([
        baseDataset,
        { ...baseDataset, hidden: true }
      ]) as Context;

      const result = formatBarAndLineDataLabel(25, mockContext, 'data-label', {
        style: 'number',
        columnType: 'number'
      });

      // 25 out of series total (50) = 50% (since second dataset is hidden)
      expect(result).toBe('50%');
    });
  });
});
