import { createDatasetsFromAggregates } from './createDatasetsFromAggregates';
import { aggregateBasedOnXAndCategory } from './aggregateBasedOnXAndCategory';
import { DEFAULT_COLUMN_LABEL_FORMAT, IColumnLabelFormat } from '@/api/asset_interfaces/metric';

describe('createDatasetsFromAggregates', () => {
  it('should create datasets with categories correctly', () => {
    // Mock raw data
    const mockData = [
      { month: 'Jan', region: 'North', sales: 100 },
      { month: 'Jan', region: 'South', sales: 150 },
      { month: 'Feb', region: 'North', sales: 200 },
      { month: 'Feb', region: 'South', sales: 250 }
    ];

    const xFields = ['month'];
    const measureFields = ['sales'];
    const categoryFields = ['region'];
    const isScatter = false;
    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0 as const
      }
    };

    // Aggregate the data using aggregateBasedOnXAndCategory
    const aggregatedResult = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    console.log(aggregatedResult);

    // Pass the aggregated result to createDatasetsFromAggregates
    const result = createDatasetsFromAggregates({
      ...aggregatedResult,
      isScatter,
      tooltipFields: ['sales']
    });

    console.log(result);
  });
});
