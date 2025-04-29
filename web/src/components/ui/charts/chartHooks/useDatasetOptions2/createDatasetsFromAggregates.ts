import { aggregateBasedOnXAndCategory } from './aggregateBasedOnXAndCategory';
import { extractFieldsFromChain, appendToKeyValueChain } from './groupingHelpers';

type CreateDatasetsFromAggregatesReturn = {
  datasets: {
    label: { key: string; value: string }[]; //this will be the key value pairs of the x axis
    data: (number | null)[]; //this will be the data for the y axis
    dataKey: string | null; //this will be the key for the data
    //each data point has a tooltip data
    tooltipData: {
      value: string;
      key: string;
    }[];
  }[];
};

export const createDatasetsFromAggregates = ({
  aggregatedData,
  xFieldsSet,
  categoriesSet,
  isScatter
}: ReturnType<typeof aggregateBasedOnXAndCategory> & {
  isScatter: boolean;
  tooltipFields: string[];
}): CreateDatasetsFromAggregatesReturn => {
  const datasets: CreateDatasetsFromAggregatesReturn['datasets'] = [];
  const datasetRecord: Record<string, number> = {}; //this will be the "label" and the index of the dataset
  const hasCategories = categoriesSet.size > 0;

  const firstKey = Array.from(aggregatedData.keys())[0];
  const measureFields = Object.keys(aggregatedData.get(firstKey) || {});
  const hasMultipleMeasures = measureFields.length > 1;
  const firstXField = Array.from(xFieldsSet)[0];
  const numberOfXFields = extractFieldsFromChain(firstXField).length;

  if (hasCategories && !hasMultipleMeasures) {
    const categories = Array.from(categoriesSet);
    const xValues = Array.from(xFieldsSet);
    console.log('aggregatedData', aggregatedData);
    aggregatedData.entries().forEach(([key, value]) => {
      measureFields.forEach((measureField) => {
        const extractedFields = extractFieldsFromChain(key);
        const xFields = extractedFields.slice(0, numberOfXFields);
        const categoryFields = extractedFields.slice(numberOfXFields);

        const label: { key: string; value: string }[] = [];
        categoryFields.forEach((categoryField) => {
          label.push(categoryField);
        });
        const labelString = label.join('|');
        if (!datasetRecord[labelString]) {
          datasetRecord[labelString] = datasets.length;
          datasets.push({
            label: label,
            data: [],
            dataKey: measureFields.length > 1 ? null : measureField,
            tooltipData: []
          });
        }

        const datasetIndex = datasetRecord[labelString];
        const dataset = datasets[datasetIndex];
        const dataPoint = value[measureFields[0]];

        if (isScatter) {
          dataset.data.push(...(dataPoint as (number | null)[]));
        } else {
          const sumOfDataPoint = dataPoint.reduce<number>((acc, curr) => {
            if (typeof curr !== 'number') {
              return acc;
            }
            return acc + curr;
          }, 0);
          dataset.data.push(sumOfDataPoint);
        }
      });
    });

    console.log('datasets!', datasets[0]);
  }

  return { datasets };
};
