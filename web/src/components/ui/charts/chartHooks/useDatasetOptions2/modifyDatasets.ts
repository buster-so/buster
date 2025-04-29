import { BarSortBy, BusterChartProps, ChartType, PieSortBy } from '@/api/asset_interfaces/metric';
import { DatasetOption } from './interfaces';

type ModifyDatasetsParams = {
  datasets: DatasetOption[];
  pieMinimumSlicePercentage: number | undefined;
  barSortBy: BarSortBy | undefined;
  pieSortBy: PieSortBy | undefined;
  barGroupType: BusterChartProps['barGroupType'] | undefined;
  lineGroupType: BusterChartProps['lineGroupType'];
  selectedChartType: ChartType;
};

export const modifyDatasets = ({
  datasets,
  pieMinimumSlicePercentage,
  barSortBy,
  pieSortBy,
  barGroupType,
  lineGroupType,
  selectedChartType
}: ModifyDatasetsParams) => {
  if (selectedChartType === ChartType.Pie && pieMinimumSlicePercentage) {
    //I need to modify the datasets to ensure that the pie slices are at least the size of the pieMinimumSlicePercentage
    //We should do this by ensuring that the smallest slice is at least the size of the pieMinimumSlicePercentage
    //if it is not, we should combine slices until it is
    //Remove the datasets that are below the pieMinimumSlicePercentage and add them to this new dataset. The label should be "Other"
  }

  if (selectedChartType === ChartType.Pie && pieSortBy === 'value') {
    //I need to modify the datasets to ensure that the pie slices are sorted by value
    //We should do this by sorting the datasets (and their assosciated labels) by the value of the data
    //This makes sure that the largest slices are at the top
  }

  if (selectedChartType === ChartType.Pie && pieSortBy === 'key') {
    //I need to modify the datasets to ensure that the pie slices are sorted by key (which is the label)
    //We should do this by sorting the datasets (and their assosciated labels) by the key of the data
    //This makes sure that the slices are always in the same order
  }

  if (
    (selectedChartType === 'bar' && barGroupType === 'percentage-stack') ||
    (selectedChartType === 'line' && lineGroupType === 'percentage-stack')
  ) {
    //If we are using a percentage stack, we need to modify the datasets to ensure that the sum of the slices is 100%
    //We should do this by ensuring that all of the values are divided by the sum of the values
    //This makes sure that the slices are always 100%
  }

  if (selectedChartType === 'bar' && barSortBy && barSortBy?.some((y) => y !== 'none')) {
    //If we are using a bar sort by, we need to modify the datasets to ensure that the bars are sorted by the barSortBy
    //We should do this by sorting the datasets by the barSortBy
    //This makes sure that the bars are always in the same order
  }
};
