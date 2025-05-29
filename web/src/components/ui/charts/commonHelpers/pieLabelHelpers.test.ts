import { describe, it, expect } from 'vitest';
import { InnerLabelTitleRecord, getPieInnerLabelTitle } from './pieLabelHelpers';
import type { BusterChartConfigProps } from '@/api/asset_interfaces/metric/charts';

describe('pieLabelHelpers', () => {
  describe('InnerLabelTitleRecord', () => {
    it('should have the correct titles for each aggregate type', () => {
      expect(InnerLabelTitleRecord.sum).toBe('Total');
      expect(InnerLabelTitleRecord.average).toBe('Average');
      expect(InnerLabelTitleRecord.median).toBe('Median');
      expect(InnerLabelTitleRecord.max).toBe('Max');
      expect(InnerLabelTitleRecord.min).toBe('Min');
      expect(InnerLabelTitleRecord.count).toBe('Count');
    });
  });

  describe('getPieInnerLabelTitle', () => {
    it('should return the provided title when pieInnerLabelTitle is provided', () => {
      const pieInnerLabelTitle = 'Custom Title';
      const pieInnerLabelAggregate: BusterChartConfigProps['pieInnerLabelAggregate'] = 'sum';

      const result = getPieInnerLabelTitle(pieInnerLabelTitle, pieInnerLabelAggregate);

      expect(result).toBe('Custom Title');
    });

    it('should return the aggregate title when pieInnerLabelTitle is not provided', () => {
      const pieInnerLabelTitle = undefined;
      const pieInnerLabelAggregate: BusterChartConfigProps['pieInnerLabelAggregate'] = 'average';

      const result = getPieInnerLabelTitle(pieInnerLabelTitle, pieInnerLabelAggregate);

      expect(result).toBe('Average');
    });

    it('should default to "sum" aggregate when pieInnerLabelAggregate is not provided', () => {
      const pieInnerLabelTitle = undefined;
      const pieInnerLabelAggregate = undefined;

      const result = getPieInnerLabelTitle(pieInnerLabelTitle, pieInnerLabelAggregate);

      expect(result).toBe('Total');
    });

    it('should fall back to aggregate title when pieInnerLabelTitle is null', () => {
      const pieInnerLabelTitle = null as unknown as BusterChartConfigProps['pieInnerLabelTitle'];
      const pieInnerLabelAggregate: BusterChartConfigProps['pieInnerLabelAggregate'] = 'median';

      const result = getPieInnerLabelTitle(pieInnerLabelTitle, pieInnerLabelAggregate);

      expect(result).toBe('Median');
    });

    it('should work with each type of aggregate', () => {
      const testCases: Array<NonNullable<BusterChartConfigProps['pieInnerLabelAggregate']>> = [
        'sum',
        'average',
        'median',
        'max',
        'min',
        'count'
      ];

      testCases.forEach((aggregate) => {
        const result = getPieInnerLabelTitle(undefined, aggregate);
        expect(result).toBe(InnerLabelTitleRecord[aggregate]);
      });
    });
  });
});
