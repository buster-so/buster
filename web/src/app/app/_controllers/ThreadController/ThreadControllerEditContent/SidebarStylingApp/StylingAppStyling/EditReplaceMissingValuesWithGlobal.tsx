import React, { useMemo } from 'react';
import type { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads/threadConfigInterfaces';
import { IColumnLabelFormat } from '@/components/charts';
import { useMemoizedFn } from 'ahooks';
import { EditReplaceMissingData } from '../StylingAppVisualize/SelectAxis/SelectAxisColumnContent/EditReplaceMissingData';

export const EditReplaceMissingValuesWithGlobal: React.FC<{
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  onUpdateChartConfig: (config: Partial<IBusterThreadMessageChartConfig>) => void;
}> = React.memo(
  ({ columnLabelFormats, onUpdateChartConfig }) => {
    const mostPermissiveMissingWith = useMemo(() => {
      return Object.values(columnLabelFormats).some(
        ({ replaceMissingDataWith }) => replaceMissingDataWith === null
      )
        ? null
        : 0;
    }, [columnLabelFormats]);

    const onUpdateColumnLabel = useMemoizedFn((config: Partial<IColumnLabelFormat>) => {
      const newColumnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'] =
        Object.entries(columnLabelFormats).reduce<
          IBusterThreadMessageChartConfig['columnLabelFormats']
        >((acc, [key, value]) => {
          acc[key] = { ...value, ...config };
          return acc;
        }, {});

      onUpdateChartConfig({ columnLabelFormats: newColumnLabelFormats });
    });

    return (
      <EditReplaceMissingValuesWithColumn
        replaceMissingDataWith={mostPermissiveMissingWith}
        onUpdateColumnLabel={onUpdateColumnLabel}
      />
    );
  },
  () => {
    return true;
  }
);
EditReplaceMissingValuesWithGlobal.displayName = 'EditReplaceMissingValuesWithGlobal';

const EditReplaceMissingValuesWithColumn: React.FC<{
  replaceMissingDataWith: Required<IColumnLabelFormat>['replaceMissingDataWith'];
  onUpdateColumnLabel: (config: Partial<IColumnLabelFormat>) => void;
}> = React.memo(({ replaceMissingDataWith, onUpdateColumnLabel }) => {
  return (
    <EditReplaceMissingData
      replaceMissingDataWith={replaceMissingDataWith}
      onUpdateColumnConfig={onUpdateColumnLabel}
    />
  );
});
EditReplaceMissingValuesWithColumn.displayName = 'EditReplaceMissingValuesWithColumn';
