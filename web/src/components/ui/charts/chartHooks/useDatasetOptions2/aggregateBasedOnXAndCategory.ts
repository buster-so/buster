import { BusterChartProps, DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import { appendToKeyValueChain } from './groupingHelpers';

type ReturnCategorizedAndAggregatedData = {
  aggregatedData: Map<
    string, // xValue|category
    Record<string, (string | number | Date | null)[]> // measures with their values
  >;
  categoriesSet: Set<string>;
  xFieldsSet: Set<string>;
};

export const aggregateBasedOnXAndCategory = (
  sortedData: Record<string, string | number | Date | null>[],
  xFields: string[],
  measureFields: string[],
  categoryFields: string[],
  isScatter: boolean,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
): ReturnCategorizedAndAggregatedData => {
  const xFieldsSet = new Set<string>();
  const categoriesSet = new Set<string>();

  const aggregatedData = new Map<string, Record<string, (string | number | Date | null)[]>>();

  for (const dataPoint of sortedData) {
    // Construct a combined xValue from all xFields
    const xValues = xFields.map((field) => dataPoint[field]);

    // Create a key chain using xFields and xValues
    const xValue = appendToKeyValueChain(
      xFields.map((field, index) => ({
        key: field,
        value: xValues[index]?.toString() || ''
      }))
    );

    if (isScatter) {
      if (categoryFields.length === 0) {
        // If no category fields are specified, use empty string as key
        const key = '';

        // Create or get the record for this key
        if (!aggregatedData.has(key)) {
          aggregatedData.set(key, {});
        }

        // Add measure values to the record
        for (const measureField of measureFields) {
          let measureValue = dataPoint[measureField];
          const columnLabelFormat = columnLabelFormats[measureField] || DEFAULT_COLUMN_LABEL_FORMAT;
          const replaceMissingDataWith =
            columnLabelFormat.replaceMissingDataWith !== undefined
              ? columnLabelFormat.replaceMissingDataWith
              : DEFAULT_COLUMN_LABEL_FORMAT.replaceMissingDataWith;

          // Handle null or undefined values
          if (measureValue === null || measureValue === undefined) {
            measureValue = replaceMissingDataWith;
          }

          // Store the measure value in the record
          const record = aggregatedData.get(key)!;
          if (!record[measureField]) {
            record[measureField] = [measureValue];
          } else {
            (record[measureField] as (string | number | Date | null)[]).push(measureValue);
          }
        }
      } else {
        // For scatter charts, we group by category
        const categoryValues = categoryFields.map((field) => dataPoint[field]);
        // Skip if any category value is null or undefined
        if (categoryValues.some((val) => val === null || val === undefined)) continue;

        // Create key pairs for categoryFields
        const keyPairs = [
          ...categoryFields.map((field, index) => ({
            key: field,
            value: categoryValues[index]?.toString() || ''
          }))
        ];

        const key = appendToKeyValueChain(keyPairs);
        categoriesSet.add(key);

        // Create or get the record for this key
        if (!aggregatedData.has(key)) {
          aggregatedData.set(key, {});
        }

        // Add measure values to the record
        for (const measureField of measureFields) {
          let measureValue = dataPoint[measureField];
          const columnLabelFormat = columnLabelFormats[measureField] || DEFAULT_COLUMN_LABEL_FORMAT;
          const replaceMissingDataWith =
            columnLabelFormat.replaceMissingDataWith !== undefined
              ? columnLabelFormat.replaceMissingDataWith
              : DEFAULT_COLUMN_LABEL_FORMAT.replaceMissingDataWith;

          // Handle null or undefined values
          if (measureValue === null || measureValue === undefined) {
            measureValue = replaceMissingDataWith;
          }

          // Store the measure value in the record
          const record = aggregatedData.get(key)!;
          if (!record[measureField]) {
            record[measureField] = [measureValue];
          } else {
            (record[measureField] as (string | number | Date | null)[]).push(measureValue);
          }
        }
      }
    } else {
      if (categoryFields.length === 0) {
        // If no category fields are specified, just use xFields for the key
        const keyPairs = [
          ...xFields.map((field, index) => ({
            key: field,
            value: xValues[index]?.toString() || ''
          }))
        ];

        const key = appendToKeyValueChain(keyPairs);

        // Create or get the record for this key
        if (!aggregatedData.has(key)) {
          aggregatedData.set(key, {});
        }

        // Add measure values to the record
        for (const measureField of measureFields) {
          let measureValue = dataPoint[measureField];
          const columnLabelFormat = columnLabelFormats[measureField] || DEFAULT_COLUMN_LABEL_FORMAT;
          const replaceMissingDataWith =
            columnLabelFormat.replaceMissingDataWith !== undefined
              ? columnLabelFormat.replaceMissingDataWith
              : DEFAULT_COLUMN_LABEL_FORMAT.replaceMissingDataWith;

          // Handle null or undefined values
          if (measureValue === null || measureValue === undefined) {
            measureValue = replaceMissingDataWith;
          }

          // Store the measure value in the record
          const record = aggregatedData.get(key)!;
          if (!record[measureField]) {
            record[measureField] = [measureValue];
          } else {
            (record[measureField] as (string | number | Date | null)[]).push(measureValue);
          }
        }
      } else {
        // For non-scatter charts, we group by x and category
        const categoryValues = categoryFields.map((field) => dataPoint[field]);
        // Skip if any category value is null or undefined
        //  if (categoryValues.some((val) => val === null || val === undefined)) continue;

        const categoryKeyPairs = categoryFields.map((field, index) => ({
          key: field,
          value: categoryValues[index]?.toString() || ''
        }));
        categoriesSet.add(appendToKeyValueChain(categoryKeyPairs));

        // Create key pairs for xFields and categoryFields
        const keyPairs = [
          ...xFields.map((field, index) => ({
            key: field,
            value: xValues[index]?.toString() || ''
          })),
          ...categoryKeyPairs
        ];

        const key = appendToKeyValueChain(keyPairs);

        // Create or get the record for this key
        if (!aggregatedData.has(key)) {
          aggregatedData.set(key, {});
        }

        // Add measure values to the record
        for (const measureField of measureFields) {
          let measureValue = dataPoint[measureField];
          const columnLabelFormat = columnLabelFormats[measureField] || DEFAULT_COLUMN_LABEL_FORMAT;
          const replaceMissingDataWith =
            columnLabelFormat.replaceMissingDataWith !== undefined
              ? columnLabelFormat.replaceMissingDataWith
              : DEFAULT_COLUMN_LABEL_FORMAT.replaceMissingDataWith;

          // Handle null or undefined values
          if (measureValue === null || measureValue === undefined) {
            measureValue = replaceMissingDataWith;
          }

          // Store the measure value in the record
          const record = aggregatedData.get(key)!;
          if (!record[measureField]) {
            record[measureField] = [measureValue];
          } else {
            (record[measureField] as (string | number | Date | null)[]).push(measureValue);
          }
        }
      }

      // Track unique x values
      xFieldsSet.add(String(xValue));
    }
  }

  return { aggregatedData, categoriesSet, xFieldsSet };
};
