import { ChartType } from '@/api/asset_interfaces/metric/charts/enum';
import { barOptionsHandler, barPluginsHandler } from './barChartOptions';
import type { ChartSpecificOptionsProps } from './interfaces';

type BarGroupType = 'stack' | 'group' | 'percentage-stack' | null;

const baseMockProps: ChartSpecificOptionsProps = {
  pieShowInnerLabel: false,
  pieInnerLabelTitle: '',
  pieInnerLabelAggregate: 'sum',
  pieDonutWidth: 0,
  pieLabelPosition: 'outside',
  pieDisplayLabelAs: 'number',
  columnLabelFormats: {},
  selectedAxis: { x: [], y: [], y2: [], category: [] },
  barShowTotalAtTop: false,
  columnSettings: {},
  barGroupType: null,
  data: { datasets: [], labels: [] }
};

describe('barOptionsHandler', () => {
  it('should return an empty object for any input props', () => {
    const result = barOptionsHandler(baseMockProps);
    expect(result).toEqual({});
  });
});

describe('barPluginsHandler', () => {
  it('should enable totalizer when barShowTotalAtTop is true', () => {
    const mockProps = {
      ...baseMockProps,
      barShowTotalAtTop: true
    };

    const result = barPluginsHandler(mockProps);
    expect(result).toEqual({
      totalizer: {
        enabled: true
      }
    });
  });

  it('should enable totalizer when any column has showDataLabelsAsPercentage', () => {
    const mockProps = {
      ...baseMockProps,
      columnSettings: {
        column1: { showDataLabelsAsPercentage: true },
        column2: { showDataLabelsAsPercentage: false }
      }
    };

    const result = barPluginsHandler(mockProps);
    expect(result).toEqual({
      totalizer: {
        enabled: true
      }
    });
  });

  it('should enable totalizer when barGroupType is provided', () => {
    const mockProps = {
      ...baseMockProps,
      barGroupType: 'stack' as BarGroupType
    };

    const result = barPluginsHandler(mockProps);
    expect(result).toEqual({
      totalizer: {
        enabled: true
      }
    });
  });

  it('should disable totalizer when no enabling conditions are met', () => {
    const mockProps = {
      ...baseMockProps,
      columnSettings: {
        column1: { showDataLabelsAsPercentage: false }
      }
    };

    const result = barPluginsHandler(mockProps);
    expect(result).toEqual({
      totalizer: {
        enabled: false
      }
    });
  });
});
