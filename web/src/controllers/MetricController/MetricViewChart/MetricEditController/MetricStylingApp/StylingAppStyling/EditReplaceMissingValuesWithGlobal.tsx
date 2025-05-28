import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { useMemoizedFn } from '@/hooks';
import React, { useMemo } from 'react';
import { EditReplaceMissingData } from '../StylingAppVisualize/SelectAxis/SelectAxisColumnContent/EditReplaceMissingData';

export const EditReplaceMissingValuesWithGlobal: React.FC<{
  columnLabelFormats: IBusterMetricChartConfig['columnLabelFormats'];
  onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
}> = React.memo(({ columnLabelFormats, onUpdateChartConfig }) => {
  const mostPermissiveMissingWith = useMemo(() => {
    return Object.values(columnLabelFormats).some(
      ({ replaceMissingDataWith }) => replaceMissingDataWith === null
    )
      ? null
      : (0 as const);
  }, [columnLabelFormats]);

  const onUpdateColumnLabel = useMemoizedFn((config: Partial<IColumnLabelFormat>) => {
    const newColumnLabelFormats: IBusterMetricChartConfig['columnLabelFormats'] = Object.entries(
      columnLabelFormats
    ).reduce<IBusterMetricChartConfig['columnLabelFormats']>((acc, [key, value]) => {
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
});
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
