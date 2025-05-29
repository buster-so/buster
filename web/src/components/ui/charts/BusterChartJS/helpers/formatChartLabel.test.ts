import type { BusterChartProps } from '@/api/asset_interfaces/metric/charts';
import { describe, expect, it } from 'vitest';
import { formatChartLabel } from './formatChartLabel';

describe('formatChartLabel', () => {
  const columnLabelFormats = {
    month: {
      style: 'date',
      compactNumbers: false,
      columnType: 'date',
      displayName: '',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      currency: 'USD',
      convertNumberTo: null,
      dateFormat: 'MMM YYYY',
      useRelativeTime: false,
      isUTC: false,
      multiplier: 1,
      prefix: '',
      suffix: '',
      replaceMissingDataWith: null,
      makeLabelHumanReadable: true
    },
    recent_total: {
      style: 'currency',
      compactNumbers: false,
      columnType: 'number',
      displayName: '',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currency: 'USD',
      convertNumberTo: null,
      dateFormat: 'auto',
      useRelativeTime: false,
      isUTC: false,
      multiplier: 1,
      prefix: '',
      suffix: '',
      replaceMissingDataWith: 0,
      makeLabelHumanReadable: true
    },
    percentage: {
      style: 'percent',
      compactNumbers: false,
      columnType: 'number',
      displayName: '',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      makeLabelHumanReadable: true
    },
    text_field: {
      style: 'string',
      compactNumbers: false,
      columnType: 'text',
      displayName: 'Custom Text',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      makeLabelHumanReadable: true
    },
    custom_field: {
      style: 'number',
      compactNumbers: true,
      columnType: 'number',
      displayName: 'Custom Display',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      prefix: '(',
      suffix: ')',
      makeLabelHumanReadable: true
    }
  } satisfies NonNullable<BusterChartProps['columnLabelFormats']>;

  it('should format a date label correctly', () => {
    const result = formatChartLabel('2024-03-14', 'month', columnLabelFormats);
    expect(result).toBe('2024-03-14');
  });

  it('should format a currency value correctly', () => {
    const result = formatChartLabel('1234.567', 'recent_total', columnLabelFormats);
    expect(result).toBe('1234.567');
  });

  it('should format a text field with human readable display name', () => {
    const result = formatChartLabel('some_field_name', 'text_field', columnLabelFormats);
    expect(result).toBe('Custom Text');
  });
});
