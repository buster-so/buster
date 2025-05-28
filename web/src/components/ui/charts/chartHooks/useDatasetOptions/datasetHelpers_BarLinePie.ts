'use client';

import type { BusterChartProps } from '@/api/asset_interfaces/metric/charts';
import { createDayjsDate } from '@/lib/date';
import type { ColumnMetaData, SimplifiedColumnType } from '@/api/asset_interfaces/metric';

export const sortLineBarData = (
  data: NonNullable<BusterChartProps['data']>,
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>,
  xFieldSorts: string[],
  xFields: string[]
) => {
  if (xFieldSorts.length === 0) return data;

  const columnMetadataRecord = columnMetadata.reduce<Record<string, ColumnMetaData>>(
    (acc, curr) => {
      acc[curr.name] = curr;
      return acc;
    },
    {}
  );

  const sortedData = [...data];
  if (xFieldSorts.length > 0) {
    sortedData.sort((a, b) => {
      for (let i = 0; i < xFieldSorts.length; i++) {
        const field = xFields[i];
        const fieldType: SimplifiedColumnType = columnMetadataRecord[field]?.simple_type || 'text';

        //NUMBER CASE
        if (
          fieldType === 'number' ||
          (typeof a[field] === 'number' && typeof b[field] === 'number')
        ) {
          if (a[field] !== b[field]) {
            return (a[field] as number) - (b[field] as number);
          }
        }

        //DATE CASE
        else if (fieldType === 'date') {
          const aDate = createDayjsDate(a[field] as string);
          const bDate = createDayjsDate(b[field] as string);
          if (aDate.valueOf() !== bDate.valueOf()) {
            return aDate.valueOf() - bDate.valueOf();
          }
        }

        //TEXT CASE
        else {
          if (a[field] !== b[field]) {
            return String(a[field]).localeCompare(String(b[field]));
          }
        }
      }
      return 0;
    });
  }
  return sortedData;
};
