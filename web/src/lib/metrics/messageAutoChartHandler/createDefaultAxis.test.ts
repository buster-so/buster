import { DEFAULT_CHART_CONFIG } from '@/api/asset_interfaces/metric';
import type { ColumnMetaData } from '@/api/asset_interfaces/metric';
import { describe, expect, it } from 'vitest';
import {
  createDefaultBarAndLineAxis,
  createDefaultPieAxis,
  createDefaultScatterAxis
} from './createDefaultAxis';

describe('createDefaultAxis', () => {
  describe('createDefaultBarAndLineAxis', () => {
    it('should create a default bar and line axis with date and number columns', () => {
      const columnsMetaData: ColumnMetaData[] = [
        {
          name: 'date_column',
          simple_type: 'date',
          min_value: '',
          max_value: '',
          unique_values: 5,
          type: 'date'
        },
        {
          name: 'number_column',
          simple_type: 'number',
          min_value: 0,
          max_value: 100,
          unique_values: 10,
          type: 'float'
        }
      ];

      const result = createDefaultBarAndLineAxis(columnsMetaData);

      expect(result).toEqual({
        ...DEFAULT_CHART_CONFIG.barAndLineAxis,
        x: ['date_column'],
        y: ['number_column']
      });
    });

    it('should create a default bar and line axis with string and number columns when no date column exists', () => {
      const columnsMetaData: ColumnMetaData[] = [
        {
          name: 'string_column',
          simple_type: 'text',
          min_value: '',
          max_value: '',
          unique_values: 5,
          type: 'text'
        },
        {
          name: 'number_column',
          simple_type: 'number',
          min_value: 0,
          max_value: 100,
          unique_values: 10,
          type: 'float'
        }
      ];

      const result = createDefaultBarAndLineAxis(columnsMetaData);

      expect(result).toEqual({
        ...DEFAULT_CHART_CONFIG.barAndLineAxis,
        x: ['string_column'],
        y: ['number_column']
      });
    });

    it('should create a default bar and line axis with empty arrays when no columns exist', () => {
      const columnsMetaData: ColumnMetaData[] = [];

      const result = createDefaultBarAndLineAxis(columnsMetaData);

      expect(result).toEqual({
        ...DEFAULT_CHART_CONFIG.barAndLineAxis,
        x: [],
        y: []
      });
    });

    it('should handle undefined columnsMetaData', () => {
      const result = createDefaultBarAndLineAxis(undefined);

      expect(result).toEqual({
        ...DEFAULT_CHART_CONFIG.barAndLineAxis,
        x: [],
        y: []
      });
    });
  });

  describe('createDefaultPieAxis', () => {
    it('should create a default pie axis with string and number columns', () => {
      const columnsMetaData: ColumnMetaData[] = [
        {
          name: 'string_column',
          simple_type: 'text',
          min_value: '',
          max_value: '',
          unique_values: 5,
          type: 'text'
        },
        {
          name: 'number_column',
          simple_type: 'number',
          min_value: 0,
          max_value: 100,
          unique_values: 10,
          type: 'float'
        }
      ];

      const result = createDefaultPieAxis(columnsMetaData);

      expect(result).toEqual({
        ...DEFAULT_CHART_CONFIG.pieChartAxis,
        x: ['string_column'],
        y: ['number_column']
      });
    });

    it('should create a default pie axis with date and number columns when no string column exists', () => {
      const columnsMetaData: ColumnMetaData[] = [
        {
          name: 'date_column',
          simple_type: 'date',
          min_value: '',
          max_value: '',
          unique_values: 5,
          type: 'date'
        },
        {
          name: 'number_column',
          simple_type: 'number',
          min_value: 0,
          max_value: 100,
          unique_values: 10,
          type: 'float'
        }
      ];

      const result = createDefaultPieAxis(columnsMetaData);

      expect(result).toEqual({
        ...DEFAULT_CHART_CONFIG.pieChartAxis,
        x: ['date_column'],
        y: ['number_column']
      });
    });

    it('should create a default pie axis with empty arrays when no columns exist', () => {
      const columnsMetaData: ColumnMetaData[] = [];

      const result = createDefaultPieAxis(columnsMetaData);

      expect(result).toEqual({
        ...DEFAULT_CHART_CONFIG.pieChartAxis,
        x: [],
        y: []
      });
    });

    it('should handle undefined columnsMetaData', () => {
      const result = createDefaultPieAxis(undefined);

      expect(result).toEqual({
        ...DEFAULT_CHART_CONFIG.pieChartAxis,
        x: [],
        y: []
      });
    });
  });

  describe('createDefaultScatterAxis', () => {
    it('should create a default scatter axis with two number columns', () => {
      const columnsMetaData: ColumnMetaData[] = [
        {
          name: 'number_column1',
          simple_type: 'number',
          min_value: 0,
          max_value: 100,
          unique_values: 10,
          type: 'float'
        },
        {
          name: 'number_column2',
          simple_type: 'number',
          min_value: 0,
          max_value: 100,
          unique_values: 10,
          type: 'float'
        }
      ];

      const result = createDefaultScatterAxis(columnsMetaData);

      expect(result).toEqual({
        ...DEFAULT_CHART_CONFIG.scatterAxis,
        x: ['number_column1'],
        y: ['number_column2']
      });
    });

    it('should create a default scatter axis with empty y array when only one number column exists', () => {
      const columnsMetaData: ColumnMetaData[] = [
        {
          name: 'number_column1',
          simple_type: 'number',
          min_value: 0,
          max_value: 100,
          unique_values: 10,
          type: 'float'
        },
        {
          name: 'string_column',
          simple_type: 'text',
          min_value: '',
          max_value: '',
          unique_values: 5,
          type: 'text'
        }
      ];

      const result = createDefaultScatterAxis(columnsMetaData);

      expect(result).toEqual({
        ...DEFAULT_CHART_CONFIG.scatterAxis,
        x: ['number_column1'],
        y: []
      });
    });

    it('should create a default scatter axis with empty arrays when no number columns exist', () => {
      const columnsMetaData: ColumnMetaData[] = [
        {
          name: 'string_column',
          simple_type: 'text',
          min_value: '',
          max_value: '',
          unique_values: 5,
          type: 'text'
        },
        {
          name: 'date_column',
          simple_type: 'date',
          min_value: '',
          max_value: '',
          unique_values: 5,
          type: 'date'
        }
      ];

      const result = createDefaultScatterAxis(columnsMetaData);

      expect(result).toEqual({
        ...DEFAULT_CHART_CONFIG.scatterAxis,
        x: [],
        y: []
      });
    });

    it('should handle undefined columnsMetaData', () => {
      const result = createDefaultScatterAxis(undefined);

      expect(result).toEqual({
        ...DEFAULT_CHART_CONFIG.scatterAxis,
        x: [],
        y: []
      });
    });
  });
});
